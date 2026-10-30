import { NextResponse } from "next/server";
import { geminiConfig } from "@/config/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  sanitizeString,
  clampNumber,
  safeErrorResponse,
  requireAuthSession,
} from "@/lib/security";
import {
  geminiBudgetBreakdownSchema,
  geminiPrepCalendarTasksSchema,
  geminiDayOfRunOfShowSchema,
  geminiMediatorStarterPromptsSchema,
} from "@/lib/gemini-schemas";

export interface AiEvaluationOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
  tag?: string;
  status?: string;
}

export interface AiEvaluationQuestion {
  question: string;
  description: string;
  options: AiEvaluationOption[];
}

export interface EvaluationSummary {
  eventVibe: string;
  feasibilityAssessment: string;
  costPerGuest: number;
}

export interface BudgetBreakdownItem {
  category: string;
  allocatedAmount: number;
  percentage: number;
  sliderMin: number;
  sliderMax: number;
  spendStrategy: string;
}

export interface PrepCalendarTask {
  id: string;
  title: string;
  department: string;
  actionType: "call" | "arrange" | "design" | "procure" | "setup";
  daysBeforeEvent: number;
  scheduledDate: string; // YYYY-MM-DD concrete calendar date
  estimatedCost: number;
  actionBrief: string;
  priority: "high" | "medium" | "low";
}

export interface DayOfRunOfShowItem {
  timeSlot: string;
  activity: string;
  departmentInCharge: string;
  operationalNotes: string;
  dependency: string;
}

export interface AiEvaluationResponse {
  success: boolean;
  evaluationSummary?: EvaluationSummary;
  budgetBreakdown?: BudgetBreakdownItem[];
  prepCalendarTasks?: PrepCalendarTask[];
  dayOfRunOfShow?: DayOfRunOfShowItem[];
  mediatorStarterPrompts?: string[];
  aiSummary: {
    headline: string;
    overview: string;
    budgetPerGuest: string;
    feasibility: string;
    recommendedVibe: string;
  };
  questions: {
    decorations: AiEvaluationQuestion;
    arrangements: AiEvaluationQuestion;
    requirements: AiEvaluationQuestion;
  };
  source: "gemini-api" | "kordena-ai-engine";
}

export async function POST(request: Request) {
  // 1. Rate limiting protection
  const rateLimit = checkRateLimit(request, {
    maxRequests: 30,
    windowSeconds: 60,
    bucketPrefix: "ai:evaluate",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  // 2. Strict Authentication Guard - Lock route for unauthorized users
  const auth = await requireAuthSession(
    "Unauthorized: You must be signed in to evaluate event blueprints with AI."
  );
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await request.json();
    const {
      eventName = "Untitled Event",
      eventType = "Conference",
      guestCount = 100,
      budget = 250000,
      eventDate = "",
      endDate = "",
      tier = "Starter",
      leadOrganizer = "",
      planningItems = [],
      plannedItems = [],
    } = body;

    const trimmedName = sanitizeString(eventName, 120) || "Untitled Event";
    const resolvedGuestCount = clampNumber(guestCount, 1, 1_000_000, 100);
    const resolvedBudget = clampNumber(budget, 0, 1_000_000_000, 250000);
    const resolvedType = sanitizeString(eventType, 50) || "Conference";
    const resolvedTier = sanitizeString(tier, 50) || "Starter";
    const perGuest = Math.round(resolvedBudget / resolvedGuestCount);

    // Collect planning points from either planningItems or plannedItems
    const rawPlanned = Array.isArray(planningItems) && planningItems.length
      ? planningItems
      : Array.isArray(plannedItems)
        ? plannedItems
        : [];
    const plannedList = rawPlanned.filter(Boolean);

    const todayDate = new Date().toISOString().split("T")[0];
    const targetEndDate = endDate || eventDate || "Date TBD";

    // Validate: event date cannot be today (no prep time available)
    if (targetEndDate !== "Date TBD") {
      const eventDateNorm = new Date(targetEndDate);
      const todayNorm = new Date(todayDate);
      eventDateNorm.setHours(0, 0, 0, 0);
      todayNorm.setHours(0, 0, 0, 0);

      if (eventDateNorm.getTime() === todayNorm.getTime()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Event date cannot be today. Please select a future date so we can plan preparation tasks leading up to the event.",
          },
          { status: 400 }
        );
      }

      if (eventDateNorm.getTime() < todayNorm.getTime()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Event date is in the past. Please select a future date.",
          },
          { status: 400 }
        );
      }
    }

    // Calculate total prep days available
    const totalPrepDays =
      targetEndDate !== "Date TBD"
        ? Math.ceil(
          (new Date(targetEndDate).getTime() - new Date(todayDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        : 14; // default fallback

    const plannedItemsFormatted = plannedList.length
      ? plannedList.join(", ")
      : "camera department, catering service, decoration team, audio & stage, venue arrangements";

    // 1. Attempt Gemini API with new production-grade prompt and schema
    const prompt = `You are an expert event operations producer and financial planner. 

Analyze the following event constraints and output a production-grade, calendar-ready event schedule and budget breakdown:

[EVENT PARAMETERS]
- Today's Date: ${todayDate}
- Event Name: ${trimmedName}
- Event Type: ${resolvedType}
- Tier: ${resolvedTier}
- Total Budget: ${resolvedBudget}
- Guest Count: ${resolvedGuestCount}
- Target Event Date (endDate): ${targetEndDate}
- Total Preparation Days Available: ${totalPrepDays}
- Selected Planned Items / Departments: ${plannedItemsFormatted}

[EVALUATION RULES]
1. Budget Allocation:
   - Distribute the total budget across the selected 'plannedItems' (e.g., camera department, catering service, decoration team) plus a mandatory small contingency reserve.
   - For every category, supply recommended slider boundaries ('sliderMin' and 'sliderMax') so the user can freely fine-tune amounts in the UI later without breaking overall feasibility.
   - Sum of all 'allocatedAmount' must equal the total budget.

2. Prep Calendar Tasks (Countdown Days):
   - CRITICAL: All tasks MUST be scheduled between Today's Date (${todayDate}) and Target Event Date (${targetEndDate}). You have exactly ${totalPrepDays} days of preparation time.
   - For every department in 'plannedItems', create concrete, sequential action items.
   - Each task MUST have both:
     a) 'scheduledDate': the actual calendar date in YYYY-MM-DD format when this task should be performed (must be >= ${todayDate} and <= ${targetEndDate}).
     b) 'daysBeforeEvent': the countdown number (how many days before the event date). This is calculated as the difference between ${targetEndDate} and scheduledDate.
   - Spread tasks evenly across the available ${totalPrepDays}-day window. Early tasks (vendor calls, design decisions) should be near today's date; later tasks (setup, rehearsal) should be near the event date.
   - Categorize each task strictly into: 'call', 'arrange', 'design', 'procure', or 'setup'.
   - For any "call" actionType, write an actionable phone inquiry script or checklist in 'actionBrief' (e.g., exact quantities, budget limits, package requirements).
   - For "design" or "arrange" tasks, provide clear visual and structural instructions.

3. Day-of Run-of-Show:
   - Build a realistic, chronological time-slot breakdown (e.g., "03:30 PM", "05:00 PM") for the final event day.
   - Sequence logistics to prevent clashes (e.g., staging and decor setup must finish before photography equipment testing and guest arrival).

4. Mediator Chatbot Starter Prompts:
   - Provide 3 contextual prompts the upcoming AI mediator chatbot can display to the user (e.g., "Ask me to shift the photo shoot earlier", "Adjust catering if guest count rises", "Add rain contingency for decor").

Return ONLY a valid JSON object matching the requested schema.`;

    const responseSchema = {
      type: "object",
      properties: {
        evaluationSummary: {
          type: "object",
          properties: {
            eventVibe: { type: "string" },
            feasibilityAssessment: { type: "string" },
            costPerGuest: { type: "number" },
          },
          required: ["eventVibe", "feasibilityAssessment", "costPerGuest"],
        },
        budgetBreakdown: geminiBudgetBreakdownSchema,
        prepCalendarTasks: geminiPrepCalendarTasksSchema,
        dayOfRunOfShow: geminiDayOfRunOfShowSchema,
        mediatorStarterPrompts: geminiMediatorStarterPromptsSchema,
      },
      required: [
        "evaluationSummary",
        "budgetBreakdown",
        "prepCalendarTasks",
        "dayOfRunOfShow",
        "mediatorStarterPrompts",
      ],
    };

    try {
      const result = await geminiConfig({
        prompt,
        responseSchema,
        responseMimeType: "application/json",
        timeout: 15000,
      });

      if (result.success && result.data?.evaluationSummary) {
        const data = result.data;
        return NextResponse.json({
          success: true,
          evaluationSummary: data.evaluationSummary,
          budgetBreakdown: data.budgetBreakdown,
          prepCalendarTasks: data.prepCalendarTasks,
          dayOfRunOfShow: data.dayOfRunOfShow,
          mediatorStarterPrompts: data.mediatorStarterPrompts,
          // UI compatibility mappings
          aiSummary: {
            headline: `${trimmedName} — ${data.evaluationSummary.eventVibe || resolvedTier}`,
            overview: data.evaluationSummary.feasibilityAssessment || "",
            budgetPerGuest: `₹${Number(data.evaluationSummary.costPerGuest || perGuest).toLocaleString("en-IN")}`,
            feasibility: data.evaluationSummary.feasibilityAssessment || "Balanced & Practical",
            recommendedVibe: data.evaluationSummary.eventVibe || "",
          },
          questions: {
            decorations: {
              question: "What are the decorations that you are planning?",
              description: "Select the aesthetic accents and staging elements tailored for your event",
              options: data.prepCalendarTasks
                ?.filter((t: any) => t.actionType === "design" || (t.department && t.department.toLowerCase().includes("decor")))
                .map((t: any) => ({
                  id: t.id,
                  label: t.title,
                  description: t.actionBrief,
                  recommended: t.priority === "high",
                })) || [],
            },
            arrangements: {
              question: "What are the arrangements that are done?",
              description: "Mark what is already completed or currently in progress",
              options: data.prepCalendarTasks
                ?.filter((t: any) => t.actionType === "arrange" || t.actionType === "setup")
                .map((t: any) => ({
                  id: t.id,
                  label: t.title,
                  description: t.actionBrief,
                  status: t.daysBeforeEvent <= 2 ? "In Progress" : "Pending",
                })) || [],
            },
            requirements: {
              question: "What are the requirements that you need based on that?",
              description: "Choose essential operational and technical requirements based on guest count and budget",
              options: data.budgetBreakdown?.map((b: any, idx: number) => ({
                id: `req_${idx + 1}`,
                label: `${b.category} (₹${Number(b.allocatedAmount).toLocaleString("en-IN")})`,
                description: b.spendStrategy,
                tag: b.percentage >= 20 ? "Essential" : "Recommended",
              })) || [],
            },
          },
          source: "gemini-api",
        });
      }

      console.error(
        "All Gemini models in fallback queue failed:",
        result.error,
        result.fallbackAttempts
      );

      return NextResponse.json(
        {
          success: false,
          message:
            result.error ||
            "All candidate Gemini models in the fallback queue failed to generate an evaluation.",
          fallbackAttempts: result.fallbackAttempts,
        },
        { status: 502 }
      );
    } catch (geminiError: any) {
      console.warn("Gemini AI evaluation route error:", geminiError);
      return NextResponse.json(
        {
          success: false,
          message: geminiError?.message || "Gemini AI evaluation failed",
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("AI Evaluation route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to execute AI evaluation",
      },
      { status: 500 }
    );
  }
}


