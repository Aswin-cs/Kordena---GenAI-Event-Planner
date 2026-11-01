import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  sanitizeString,
  safeErrorResponse,
  resolveDbUserId,
  findUserStatusBlueprint,
} from "@/lib/security";

/**
 * Common handler for deleting a budget category and its related tasks from a UserStatus blueprint.
 */
async function handleBudgetDelete(request: Request) {
  // Rate limiting protection
  const rateLimit = checkRateLimit(request, {
    maxRequests: 60,
    windowSeconds: 60,
    bucketPrefix: "budget:delete",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    let category = "";
    let userStatusId: string | undefined;
    let eventName: string | undefined;

    // Support both JSON body and URL query parameters
    const url = new URL(request.url);
    const queryCategory = url.searchParams.get("category");
    const queryId = url.searchParams.get("id") || url.searchParams.get("userStatusId");
    const queryEventName = url.searchParams.get("eventName");

    if (queryCategory) {
      category = queryCategory;
      userStatusId = queryId || undefined;
      eventName = queryEventName || undefined;
    } else {
      try {
        const body = await request.json();
        category = body.category || "";
        userStatusId = body.userStatusId || body.id || undefined;
        eventName = body.eventName || undefined;
      } catch {
        // Body was empty or not JSON
      }
    }

    const sanitizedCategory = sanitizeString(category, 120);
    if (!sanitizedCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid budget category name is required",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = await resolveDbUserId(session?.user?.email);

    // Locate target blueprint
    const targetDoc = await findUserStatusBlueprint({
      userStatusId,
      eventName,
      userId,
    });

    if (!targetDoc) {
      return NextResponse.json(
        {
          success: false,
          message: "No event blueprint found to update",
        },
        { status: 404 }
      );
    }

    // Ownership verification for authenticated sessions
    if (userId && !targetDoc.userId.equals(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have permission to modify this blueprint",
        },
        { status: 403 }
      );
    }

    // Execute deletion of budget category and related tasks
    const deleteMetrics = targetDoc.deleteBudgetCategory(sanitizedCategory);

    await targetDoc.save();

    return NextResponse.json({
      success: true,
      message: `Deleted '${sanitizedCategory}' allocation and ${deleteMetrics.deletedTasksCount} related task(s) successfully`,
      deletedCategory: sanitizedCategory,
      deletedTasksCount: deleteMetrics.deletedTasksCount,
      deletedRosCount: deleteMetrics.deletedRosCount,
      remainingTasksCount: deleteMetrics.remainingTasksCount,
      remainingBudgetCategoriesCount: deleteMetrics.remainingBudgetCategoriesCount,
      userStatusId: targetDoc._id,
      eventName: targetDoc.eventName,
      budgetBreakdown: targetDoc.budgetBreakdown,
      prepCalendarTasks: targetDoc.prepCalendarTasks,
      dayOfRunOfShow: targetDoc.dayOfRunOfShow,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Internal server error deleting budget category");
  }
}

export async function POST(request: Request) {
  return handleBudgetDelete(request);
}

export async function DELETE(request: Request) {
  return handleBudgetDelete(request);
}

