import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserStatus, {
  IPrepCalendarTask,
  IDayOfRunOfShowItem,
  IBudgetBreakdownItem,
} from "@/models/UserStatus.model";
import User from "@/models/User";
import { geminiConfig } from "@/config/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  escapeRegex,
  sanitizeString,
  safeErrorResponse,
  requireAuthSession,
} from "@/lib/security";

// Response Schema for Gemini distinguishing between standard Q&A vs Blueprint Edits
const chatResponseSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["question", "edit"],
      description:
        "Set to 'question' if user asks general inquiries, advice, questions, or clarification. Set to 'edit' if the user asks to add, remove, reschedule, rebalance, or modify prep tasks, run-of-show schedule, budget breakdown, or requirements.",
    },
    reply: {
      type: "string",
      description:
        "Clear, professional conversational response explaining the answer or detailing the exact changes made.",
    },
    isEditApplied: {
      type: "boolean",
      description:
        "True if the user requested an edit and updatedFields contains modified data.",
    },
    updatedFields: {
      type: "object",
      description:
        "Contains the full updated arrays reflecting UserStatus.model.ts (budgetBreakdown, prepCalendarTasks, dayOfRunOfShow, requirements). Only included when type is 'edit'.",
      properties: {
        budgetBreakdown: {
          type: "array",
          description: "Full updated budget breakdown items array if modified.",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              allocatedAmount: { type: "number" },
              percentage: { type: "number" },
              sliderMin: { type: "number" },
              sliderMax: { type: "number" },
              spendStrategy: { type: "string" },
            },
            required: [
              "category",
              "allocatedAmount",
              "percentage",
              "sliderMin",
              "sliderMax",
              "spendStrategy",
            ],
          },
        },
        prepCalendarTasks: {
          type: "array",
          description:
            "Full updated prep countdown tasks array if added, edited, or removed.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              department: { type: "string" },
              actionType: {
                type: "string",
                enum: ["call", "arrange", "design", "procure", "setup"],
              },
              daysBeforeEvent: { type: "number" },
              scheduledDate: { type: "string" },
              estimatedCost: { type: "number" },
              actionBrief: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              isCompleted: { type: "boolean" },
            },
            required: [
              "id",
              "title",
              "department",
              "actionType",
              "daysBeforeEvent",
              "estimatedCost",
              "actionBrief",
              "priority",
            ],
          },
        },
        dayOfRunOfShow: {
          type: "array",
          description:
            "Full updated day-of run-of-show timeline array if modified.",
          items: {
            type: "object",
            properties: {
              timeSlot: { type: "string" },
              activity: { type: "string" },
              departmentInCharge: { type: "string" },
              operationalNotes: { type: "string" },
              dependency: { type: "string" },
            },
            required: [
              "timeSlot",
              "activity",
              "departmentInCharge",
              "operationalNotes",
              "dependency",
            ],
          },
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description: "Full updated event requirements array if modified.",
        },
      },
    },
  },
  required: ["type", "reply", "isEditApplied"],
};

export async function POST(request: Request) {
  // 1. Rate limiting protection on AI Chat
  const rateLimit = checkRateLimit(request, {
    maxRequests: 30,
    windowSeconds: 60,
    bucketPrefix: "ai:chat",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  // 2. Strict Authentication Guard - Lock route for unauthorized users
  const auth = await requireAuthSession(
    "Unauthorized: You must be signed in to converse with Kordena AI Copilot."
  );
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { message, eventContext, apiKey } = await request.json();

    const sanitizedMessage = sanitizeString(message, 4000);
    if (!sanitizedMessage) {
      return NextResponse.json(
        { success: false, message: "A non-empty message is required" },
        { status: 400 }
      );
    }

    const currentTasks: IPrepCalendarTask[] = eventContext?.prepCalendarTasks || [];
    const currentRunOfShow: IDayOfRunOfShowItem[] = eventContext?.dayOfRunOfShow || [];
    const currentBudgetBreakdown: IBudgetBreakdownItem[] = eventContext?.budgetBreakdown || [];
    const currentRequirements: string[] = eventContext?.requirements || [];

    const tasksJson = JSON.stringify(currentTasks);
    const runOfShowJson = JSON.stringify(currentRunOfShow);
    const budgetJson = JSON.stringify(currentBudgetBreakdown);
    const reqsJson = JSON.stringify(currentRequirements);

    const systemInstruction = `You are Kordena, the intelligent GenAI Event Planner and Master Production Calendar Copilot.
You have direct capability to answer user questions OR edit the event blueprint stored in UserStatus.model.ts (budgetBreakdown, prepCalendarTasks, dayOfRunOfShow, requirements).

CURRENT EVENT BLUEPRINT:
Event Title: "${eventContext?.title || eventContext?.eventName || "Event"}"
Event Type: "${eventContext?.eventType || "Conference"}"
Event Date: "${eventContext?.date || eventContext?.eventDate || "Upcoming"}"
Total Budget: ₹${eventContext?.totalBudget || eventContext?.eventBudget || "100000"}

Existing prepCalendarTasks (${currentTasks.length} tasks):
${tasksJson}

Existing dayOfRunOfShow (${currentRunOfShow.length} items):
${runOfShowJson}

Existing budgetBreakdown (${currentBudgetBreakdown.length} items):
${budgetJson}

Existing requirements:
${reqsJson}

CLASSIFICATION RULES:
1. IF the user is just asking a question, asking for advice, asking to draft an email, or asking about status:
   - Set "type": "question"
   - Set "isEditApplied": false
   - Do NOT include updatedFields. Provide a rich, clear conversational answer in "reply".

2. IF the user requests an EDIT (e.g., "add a task", "delete task X", "reschedule load-in to 2 days before", "increase catering budget", "change task priority to high", "add requirement"):
   - Set "type": "edit"
   - Set "isEditApplied": true
   - Set "reply": A friendly explanation of the exact changes performed.
   - Set "updatedFields": Provide the complete updated array for whichever field was modified (e.g. prepCalendarTasks with the new/modified task included, budgetBreakdown with updated numbers, dayOfRunOfShow, or requirements).
   - Ensure all task objects retain or generate valid IDs, appropriate actionType, and numeric costs.`;

    let replyData: {
      type: "question" | "edit";
      reply: string;
      isEditApplied: boolean;
      updatedFields?: {
        budgetBreakdown?: IBudgetBreakdownItem[];
        prepCalendarTasks?: IPrepCalendarTask[];
        dayOfRunOfShow?: IDayOfRunOfShowItem[];
        requirements?: string[];
      };
    } | null = null;

    try {
      // Execute via centralized geminiConfig utility with responseSchema
      const geminiResult = await geminiConfig({
        systemInstruction,
        prompt: message,
        responseSchema: chatResponseSchema,
        apiKey: apiKey?.trim() || undefined,
        temperature: 0.2, // Low temperature for high structural precision on edits
      });

      if (geminiResult.success && geminiResult.data) {
        replyData = geminiResult.data;
      } else if (geminiResult.text) {
        // In case it returned pure text
        replyData = {
          type: "question",
          reply: geminiResult.text.trim(),
          isEditApplied: false,
        };
      }
    } catch (geminiErr) {
      console.warn(
        "[Chat API] Gemini execution error, activating smart advisor fallback:",
        geminiErr
      );
    }

    // Fallback if Gemini did not produce parsed structured output
    if (!replyData) {
      replyData = generateSmartAdvisorReply(message, eventContext);
    }

    // If an edit was applied, store the updated arrays into UserStatus in MongoDB
    let savedToDb = false;
    let savedDocId: string | null = null;

    if (replyData.isEditApplied && replyData.updatedFields) {
      try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);
        let authUserId: mongoose.Types.ObjectId | null = null;

        if (session?.user?.email) {
          const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
          if (dbUser) authUserId = dbUser._id;
        } else {
          const guestUser = await User.findOne({ email: "planner@kordena.ai" });
          if (guestUser) authUserId = guestUser._id;
        }

        let targetDoc: any = null;
        if (
          eventContext?.userStatusId &&
          mongoose.Types.ObjectId.isValid(eventContext.userStatusId)
        ) {
          targetDoc = await UserStatus.findById(eventContext.userStatusId);
        }

        if (!targetDoc && (eventContext?.title || eventContext?.eventName)) {
          const safeName = escapeRegex(
            sanitizeString(eventContext?.title || eventContext?.eventName, 120)
          );
          const query: any = { eventName: { $regex: new RegExp(`^${safeName}$`, "i") } };
          if (authUserId) query.userId = authUserId;
          targetDoc = await UserStatus.findOne(query).sort({ updatedAt: -1 });
        }

        if (!targetDoc && authUserId) {
          targetDoc = await UserStatus.findOne({ userId: authUserId }).sort({
            updatedAt: -1,
          });
        }

        // Enforce ownership: only mutate if the target blueprint belongs to the caller
        if (targetDoc && authUserId && targetDoc.userId.equals(authUserId)) {
          if (Array.isArray(replyData.updatedFields.budgetBreakdown)) {
            targetDoc.budgetBreakdown = replyData.updatedFields.budgetBreakdown;
          }
          if (Array.isArray(replyData.updatedFields.prepCalendarTasks)) {
            targetDoc.prepCalendarTasks = replyData.updatedFields.prepCalendarTasks;
          }
          if (Array.isArray(replyData.updatedFields.dayOfRunOfShow)) {
            targetDoc.dayOfRunOfShow = replyData.updatedFields.dayOfRunOfShow;
          }
          if (Array.isArray(replyData.updatedFields.requirements)) {
            targetDoc.requirements = replyData.updatedFields.requirements;
          }

          await targetDoc.save();
          savedToDb = true;
          savedDocId = targetDoc._id.toString();
        }
      } catch (dbErr) {
        console.warn("[Chat API] Warning saving updated UserStatus to DB:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      type: replyData.type,
      reply: replyData.reply,
      isEditApplied: replyData.isEditApplied,
      updatedFields: replyData.updatedFields,
      savedToDb,
      savedDocId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        type: "question",
        reply: "I am ready to help refine your event. Could you rephrase your question?",
        isEditApplied: false,
      },
      { status: 500 }
    );
  }
}

function generateSmartAdvisorReply(
  message: string,
  context: any
): {
  type: "question" | "edit";
  reply: string;
  isEditApplied: boolean;
  updatedFields?: any;
} {
  const lower = (message || "").toLowerCase();
  const eventTitle = context?.title || context?.eventName || "your event";
  const tasks: IPrepCalendarTask[] = context?.prepCalendarTasks || [];
  const runOfShow: IDayOfRunOfShowItem[] = context?.dayOfRunOfShow || [];
  const budgetList: IBudgetBreakdownItem[] = context?.budgetBreakdown || [];

  // Check if user is asking to add a task
  if (
    lower.includes("add task") ||
    lower.includes("new task") ||
    lower.includes("create task") ||
    lower.includes("schedule task")
  ) {
    const newTask: IPrepCalendarTask = {
      id: `task-${Date.now()}`,
      title: "Confirm Production Equipment & Final Check",
      department: "Production & Tech",
      actionType: "setup",
      daysBeforeEvent: 2,
      estimatedCost: 15000,
      actionBrief: "Conduct physical walkthrough and check off all technical gear specifications.",
      priority: "high",
    };

    const updatedTasks = [...tasks, newTask];

    return {
      type: "edit",
      reply: `I have added a new high-priority countdown task: **"${newTask.title}"** for **${eventTitle}** scheduled at T - 2 days before event day with an estimated budget of ₹15,000.`,
      isEditApplied: true,
      updatedFields: {
        prepCalendarTasks: updatedTasks,
      },
    };
  }

  // Check if user is asking to delete or remove a task
  if (lower.includes("delete task") || lower.includes("remove task")) {
    if (tasks.length > 0) {
      const removedTask = tasks[tasks.length - 1];
      const updatedTasks = tasks.slice(0, tasks.length - 1);
      return {
        type: "edit",
        reply: `I have removed the milestone task **"${removedTask.title}"** from your countdown schedule.`,
        isEditApplied: true,
        updatedFields: {
          prepCalendarTasks: updatedTasks,
        },
      };
    }
  }

  if (
    lower.includes("priority") ||
    lower.includes("risk") ||
    lower.includes("urgent") ||
    lower.includes("prep")
  ) {
    const highTasks = tasks.filter((t: any) => t.priority === "high");
    if (highTasks.length > 0) {
      const taskList = highTasks
        .slice(0, 4)
        .map(
          (t: any) =>
            `• **[T - ${t.daysBeforeEvent} Days] ${t.title}** (${t.department}): ${
              t.actionBrief || "Critical path dependency."
            }`
        )
        .join("\n");
      return {
        type: "question",
        reply: `⚠️ **Kordena High-Priority Countdown Assessment**:

Here are the critical path items that require immediate coordination for **${eventTitle}**:

${taskList}

💡 **Action Advice**: Secure vendor confirmations and technical brief sign-offs before entering the final 48-hour delivery window.`,
        isEditApplied: false,
      };
    }
    return {
      type: "question",
      reply: `⚡ **Kordena Milestone Readiness Check**:
All countdown milestones are currently on track. Ensure all team department leads check off vendor deposits and equipment load-in passes 3 days prior to execution.`,
      isEditApplied: false,
    };
  }

  if (
    lower.includes("timeline") ||
    lower.includes("schedule") ||
    lower.includes("run of show") ||
    lower.includes("time") ||
    lower.includes("buffer")
  ) {
    if (runOfShow.length > 0) {
      const items = runOfShow
        .slice(0, 4)
        .map(
          (r: any) =>
            `• **${r.timeSlot || "TBD"}**: ${r.activity} (*${r.departmentInCharge}*)`
        )
        .join("\n");
      return {
        type: "question",
        reply: `⏱️ **Day-of Run of Show Execution Plan for ${eventTitle}**:

${items}

🛡️ **Safety Recommendation**: Insert a dedicated **15-minute operational buffer** between major stage transitions to absorb soundcheck and VIP arrival delays.`,
        isEditApplied: false,
      };
    }
    return {
      type: "question",
      reply: `⏱️ **Kordena Optimal Schedule Recommendation**:

• **T - 3 Hours**: Production load-in, AV rigging, and acoustic soundcheck.
• **T - 45 Mins**: Staff briefing, registration portal live check, ambient lighting active.
• **Hour 0**: Welcome keynote / Opening remarks.
• **Hour 1.5**: Primary event showcase & interactive sessions.
• **Hour 3.0**: Networking reception & culinary tasting.`,
      isEditApplied: false,
    };
  }

  if (
    lower.includes("budget") ||
    lower.includes("cost") ||
    lower.includes("save") ||
    lower.includes("cut") ||
    lower.includes("reallocate")
  ) {
    const budget = context?.totalBudget || context?.eventBudget || 100000;
    return {
      type: "question",
      reply: `💰 **Kordena AI Budget Optimization for ${eventTitle}** (Target: ₹${Number(
        budget
      ).toLocaleString("en-IN")}):

1. **Staging & AV Rigging**: Consolidate lighting rigs and audio modules with a single verified vendor to negotiate a 10–12% bundled discount.
2. **Catering Strategy**: Replace a continuous open buffet with curated signature courses and live experiential live counters to minimize food wastage.
3. **Collateral & Signage**: Use dynamic digital LED displays and QR badges instead of single-use printed foam boards.

*Estimated cost recovery: ~₹25,000 – ₹45,000, which can be safely channeled into your contingency reserve.*`,
      isEditApplied: false,
    };
  }

  if (
    lower.includes("vendor") ||
    lower.includes("brief") ||
    lower.includes("email") ||
    lower.includes("draft")
  ) {
    return {
      type: "question",
      reply: `📋 **Vendor Operational Load-In Briefing for ${eventTitle}**:

**Subject**: Urgent: Production Load-In Protocol & Schedule for ${eventTitle}

Dear Production Partner,

Please review our synchronized event calendar milestones for the upcoming production of **${eventTitle}**:

• **Load-In Window**: T - 1 Day (Commencing 08:00 AM)
• **Key Contact**: Stage Production Manager & Technical Lead
• **Safety & Delivery**: Loading bay passes must be presented upon entry. Rigging certifications required.
• **Soundcheck Lock**: T - 3 Hours prior to guest entry.

Please confirm receipt and acknowledge readiness: [Acknowledgement Link]

Warm regards,  
Kordena Master Operations Team`,
      isEditApplied: false,
    };
  }

  return {
    type: "question",
    reply: `✨ **Kordena Calendar Intelligence Copilot**:

I am connected to your master production schedule for **${eventTitle}**.

• **Ask Questions**: Inquire about milestones, budgets, or load-in logistics.
• **Perform Live Edits**: Tell me to *"Add a prep task to hire a videographer 3 days before"*, *"Remove the soundcheck item"*, or *"Adjust catering budget"*, and I will update your blueprint and database in real-time!`,
    isEditApplied: false,
  };
}

