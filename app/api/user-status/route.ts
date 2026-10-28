import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserStatus, { EventType } from "@/models/UserStatus.model";
import User from "@/models/User";

const VALID_EVENT_TYPES: EventType[] = [
  "Birthday",
  "Wedding",
  "Conference",
  "Corporate",
  "Product Launch",
  "Gala",
  "Networking",
  "Retreat",
  "Exhibition",
  "Other",
];

function sanitizeEventType(type?: string): EventType {
  if (!type) return "Conference";
  const found = VALID_EVENT_TYPES.find(
    (t) => t.toLowerCase() === type.trim().toLowerCase()
  );
  if (found) return found;

  const lower = type.toLowerCase();
  if (lower.includes("wedding")) return "Wedding";
  if (lower.includes("birthday") || lower.includes("party")) return "Birthday";
  if (lower.includes("conference") || lower.includes("summit")) return "Conference";
  if (
    lower.includes("corporate") ||
    lower.includes("retreat") ||
    lower.includes("launch") ||
    lower.includes("network") ||
    lower.includes("exhibition") ||
    lower.includes("gala")
  ) {
    return "Corporate";
  }
  return "Other";
}

/**
 * POST /api/user-status
 * Stores event status details submitted from the Stepper into UserStatus collection.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventName,
      eventType,
      budget,
      eventBudget,
      guestCount,
      plannedItems,
      endDate,
      eventDate,
      selectedPlan,
      tier,
      evaluationSummary,
      budgetBreakdown,
      prepCalendarTasks,
      dayOfRunOfShow,
      mediatorStarterPrompts,
      decorations,
      arrangements,
      requirements,
      aiSummary,
      aiResponse,
      userId: explicitUserId,
    } = body;

    // Validate event name
    const trimmedEventName = (eventName || "").trim();
    if (!trimmedEventName) {
      return NextResponse.json(
        { success: false, message: "Event name is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Resolve User ID: from NextAuth session, explicit request body, or fallback guest user
    let resolvedUserId: mongoose.Types.ObjectId | null = null;
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
      if (dbUser) {
        resolvedUserId = dbUser._id;
      } else {
        const newUser = await User.create({
          name: session.user.name || "Event Planner",
          email: session.user.email.toLowerCase(),
          image: session.user.image || "",
        });
        resolvedUserId = newUser._id;
      }
    } else if (explicitUserId && mongoose.Types.ObjectId.isValid(explicitUserId)) {
      resolvedUserId = new mongoose.Types.ObjectId(explicitUserId);
    }

    // If still no authenticated user, resolve or create a default guest/planner user
    if (!resolvedUserId) {
      let defaultUser = await User.findOne({ email: "planner@kordena.ai" });
      if (!defaultUser) {
        defaultUser = await User.create({
          name: "Kordena Guest Planner",
          email: "planner@kordena.ai",
        });
      }
      resolvedUserId = defaultUser._id;
    }

    // Resolve and validate numeric fields
    const resolvedBudget = Number(budget ?? eventBudget);
    if (isNaN(resolvedBudget) || resolvedBudget < 0) {
      return NextResponse.json(
        { success: false, message: "A valid non-negative budget is required" },
        { status: 400 }
      );
    }

    const resolvedGuestCount = Math.max(1, Number(guestCount) || 100);

    // Resolve date (supports endDate or eventDate string e.g. "2026-11-15")
    const dateInput = endDate || eventDate;
    const parsedDate = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "A valid event date is required" },
        { status: 400 }
      );
    }

    // Normalize event type
    const resolvedEventType = sanitizeEventType(eventType);

    // Resolve evaluation fields (either top-level or from inside aiResponse)
    const resolvedEvaluationSummary =
      evaluationSummary && typeof evaluationSummary === "object" && Object.keys(evaluationSummary).length
        ? evaluationSummary
        : aiResponse?.evaluationSummary && typeof aiResponse.evaluationSummary === "object"
        ? aiResponse.evaluationSummary
        : {};

    const resolvedBudgetBreakdown =
      Array.isArray(budgetBreakdown) && budgetBreakdown.length
        ? budgetBreakdown
        : Array.isArray(aiResponse?.budgetBreakdown)
        ? aiResponse.budgetBreakdown
        : [];

    const resolvedPrepCalendarTasks =
      Array.isArray(prepCalendarTasks) && prepCalendarTasks.length
        ? prepCalendarTasks
        : Array.isArray(aiResponse?.prepCalendarTasks)
        ? aiResponse.prepCalendarTasks
        : [];

    const resolvedDayOfRunOfShow =
      Array.isArray(dayOfRunOfShow) && dayOfRunOfShow.length
        ? dayOfRunOfShow
        : Array.isArray(aiResponse?.dayOfRunOfShow)
        ? aiResponse.dayOfRunOfShow
        : [];

    const resolvedRequirements =
      Array.isArray(requirements) && requirements.length
        ? requirements
        : Array.isArray(plannedItems) && plannedItems.length
        ? plannedItems
        : [];

    // Create UserStatus document in MongoDB matching the exact final schema
    const userStatus = await UserStatus.create({
      userId: resolvedUserId,
      eventName: trimmedEventName,
      eventType: resolvedEventType,
      tier: tier && ["Starter", "Basic", "Professional"].includes(tier) ? tier : "Starter",
      budget: resolvedBudget,
      guestCount: resolvedGuestCount,
      plannedItems: Array.isArray(plannedItems) ? plannedItems : [],
      endDate: parsedDate,
      evaluationSummary: resolvedEvaluationSummary,
      budgetBreakdown: resolvedBudgetBreakdown,
      prepCalendarTasks: resolvedPrepCalendarTasks,
      dayOfRunOfShow: resolvedDayOfRunOfShow,
      requirements: resolvedRequirements,
      aiResponse: aiResponse && typeof aiResponse === "object" ? aiResponse : {},
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event status stored successfully",
        userStatus,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error storing user status:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to store user status",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user-status
 * Fetches the user statuses for the authenticated user, or latest statuses.
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    let filter: Record<string, any> = {};

    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
      if (dbUser) {
        filter = { userId: dbUser._id };
      }
    }

    const userStatuses = await UserStatus.find(filter)
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: userStatuses.length,
      userStatuses,
    });
  } catch (error: any) {
    console.error("Error fetching user statuses:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch user statuses",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-status
 * Deletes a specific user status by ID.
 */
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing blueprint id" },
        { status: 400 }
      );
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      await UserStatus.findByIdAndDelete(id);
    }

    return NextResponse.json({
      success: true,
      message: "Blueprint removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user status:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete user status",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-status
 * Updates budgetBreakdown or budget of an existing UserStatus document.
 */
export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, eventName, budgetBreakdown, budget } = body;

    let targetDoc = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      targetDoc = await UserStatus.findById(id);
    } else if (eventName) {
      targetDoc = await UserStatus.findOne({
        eventName: (eventName || "").trim(),
      }).sort({ createdAt: -1 });
    }

    if (!targetDoc) {
      // Fallback to latest document
      targetDoc = await UserStatus.findOne().sort({ createdAt: -1 });
    }

    if (!targetDoc) {
      return NextResponse.json(
        { success: false, message: "No event blueprint found to update" },
        { status: 404 }
      );
    }

    if (Array.isArray(budgetBreakdown)) {
      targetDoc.budgetBreakdown = budgetBreakdown;
    }
    if (typeof budget === "number" && !isNaN(budget) && budget >= 0) {
      targetDoc.budget = budget;
    }

    await targetDoc.save();

    return NextResponse.json({
      success: true,
      message: "Budget breakdown updated successfully",
      updated: {
        id: targetDoc._id,
        eventName: targetDoc.eventName,
        budget: targetDoc.budget,
        budgetBreakdown: targetDoc.budgetBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Error updating user status budget breakdown:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update budget breakdown",
      },
      { status: 500 }
    );
  }
}

