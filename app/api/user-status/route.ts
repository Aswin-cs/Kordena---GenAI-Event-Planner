import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserStatus, { EventType, VALID_EVENT_TYPES } from "@/models/UserStatus.model";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  escapeRegex,
  sanitizeString,
  clampNumber,
  safeErrorResponse,
  resolveDbUserId,
  findUserStatusBlueprint,
} from "@/lib/security";
import { validateEventParameters } from "@/lib/calendar-utils";

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
  // 1. Rate limiting protection
  const rateLimit = checkRateLimit(request, {
    maxRequests: 60,
    windowSeconds: 60,
    bucketPrefix: "user-status:post",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

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

    // Validate required parameters strictly
    const validation = validateEventParameters({
      eventName,
      eventType,
      budget: budget ?? eventBudget,
      eventDate,
      endDate,
      guestCount,
      planningItems: plannedItems ?? requirements,
      plannedItems: plannedItems ?? requirements,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors).find(Boolean) || "Missing required event details";
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: firstError,
          missingFields: validation.missingFields,
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const trimmedEventName = sanitizeString(eventName, 120);

    // Connect to MongoDB
    await connectToDatabase();

    // Resolve User ID: prioritize verified NextAuth session
    const session = await getServerSession(authOptions);
    const resolvedUserId = await resolveDbUserId(
      session?.user?.email,
      explicitUserId,
      {
        createIfMissing: true,
        userName: session?.user?.name || undefined,
        userImage: session?.user?.image || undefined,
      }
    );

    if (!resolvedUserId) {
      return NextResponse.json(
        { success: false, message: "Unable to resolve active user identity" },
        { status: 500 }
      );
    }

    // Resolve and clamp numeric fields to safe bounds
    const rawBudget = budget ?? eventBudget;
    const resolvedBudget = clampNumber(rawBudget, 0, 1_000_000_000, 250000);
    const resolvedGuestCount = clampNumber(guestCount, 1, 1_000_000, 100);

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
      plannedItems: Array.isArray(plannedItems) ? plannedItems.slice(0, 50) : [],
      endDate: parsedDate,
      evaluationSummary: resolvedEvaluationSummary,
      budgetBreakdown: resolvedBudgetBreakdown,
      prepCalendarTasks: resolvedPrepCalendarTasks,
      dayOfRunOfShow: resolvedDayOfRunOfShow,
      requirements: resolvedRequirements.slice(0, 50),
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
    return safeErrorResponse(error, "Failed to store user status");
  }
}

/**
 * GET /api/user-status
 * Fetches the user statuses strictly for the authenticated user (isolated per account).
 */
export async function GET(request: Request) {
  // Rate limiting check
  const rateLimit = checkRateLimit(request, {
    maxRequests: 100,
    windowSeconds: 60,
    bucketPrefix: "user-status:get",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = await resolveDbUserId(session?.user?.email);
    if (!userId) {
      return NextResponse.json({ success: true, count: 0, userStatuses: [] });
    }
    const filter = { userId };

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
    return safeErrorResponse(error, "Failed to fetch user statuses");
  }
}

/**
 * DELETE /api/user-status
 * Deletes a specific user status by ID with strict ownership verification.
 */
export async function DELETE(request: Request) {
  const rateLimit = checkRateLimit(request, {
    maxRequests: 30,
    windowSeconds: 60,
    bucketPrefix: "user-status:delete",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "A valid blueprint id is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    let authUserId: mongoose.Types.ObjectId | null = null;

    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
      if (dbUser) authUserId = dbUser._id;
    } else {
      const guestUser = await User.findOne({ email: "planner@kordena.ai" });
      if (guestUser) authUserId = guestUser._id;
    }

    if (!authUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    const targetDoc = await UserStatus.findById(id);
    if (!targetDoc) {
      return NextResponse.json(
        { success: false, message: "Blueprint not found" },
        { status: 404 }
      );
    }

    // Verify ownership: only the owner or assigned guest user may delete
    if (!targetDoc.userId.equals(authUserId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to delete this blueprint" },
        { status: 403 }
      );
    }

    await UserStatus.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Blueprint removed successfully",
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to delete user status");
  }
}

/**
 * PATCH /api/user-status
 * Updates budgetBreakdown or budget of an existing UserStatus document with ownership check.
 */
export async function PATCH(request: Request) {
  const rateLimit = checkRateLimit(request, {
    maxRequests: 60,
    windowSeconds: 60,
    bucketPrefix: "user-status:patch",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, eventName, budgetBreakdown, budget, prepCalendarTasks, taskId, isCompleted } = body;

    const session = await getServerSession(authOptions);
    const authUserId = await resolveDbUserId(session?.user?.email);
    const targetDoc = await findUserStatusBlueprint({
      userStatusId: id,
      eventName,
      userId: authUserId,
    });

    if (!targetDoc) {
      return NextResponse.json(
        { success: false, message: "No event blueprint found to update" },
        { status: 404 }
      );
    }

    // Authorization verification
    if (authUserId && !targetDoc.userId.equals(authUserId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to modify this blueprint" },
        { status: 403 }
      );
    }

    if (Array.isArray(budgetBreakdown)) {
      targetDoc.budgetBreakdown = budgetBreakdown;
    }
    if (typeof budget === "number" && !isNaN(budget)) {
      targetDoc.budget = clampNumber(budget, 0, 1_000_000_000, targetDoc.budget);
    }

    // Support updating prepCalendarTasks array directly
    if (Array.isArray(prepCalendarTasks)) {
      targetDoc.prepCalendarTasks = prepCalendarTasks;
      targetDoc.markModified("prepCalendarTasks");
    }

    // Support single task toggle by taskId
    if (taskId && Array.isArray(targetDoc.prepCalendarTasks)) {
      const indexMatch = String(taskId).match(/^task-(\d+)$/i);
      const parsedIdx = indexMatch ? parseInt(indexMatch[1], 10) : -1;

      for (let i = 0; i < targetDoc.prepCalendarTasks.length; i++) {
        const t = targetDoc.prepCalendarTasks[i];
        if (t.id === taskId || i === parsedIdx) {
          t.isCompleted = isCompleted !== undefined ? Boolean(isCompleted) : !Boolean(t.isCompleted);
          break;
        }
      }
      targetDoc.markModified("prepCalendarTasks");
    }

    await targetDoc.save();

    return NextResponse.json({
      success: true,
      message: "Event status updated successfully",
      updated: {
        id: targetDoc._id,
        eventName: targetDoc.eventName,
        budget: targetDoc.budget,
        budgetBreakdown: targetDoc.budgetBreakdown,
        prepCalendarTasks: targetDoc.prepCalendarTasks,
      },
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to update budget breakdown");
  }
}

