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
 * Handles toggling or explicitly setting the isCompleted status of a prep calendar task.
 */
async function handleTaskToggle(request: Request) {
  const rateLimit = checkRateLimit(request, {
    maxRequests: 120,
    windowSeconds: 60,
    bucketPrefix: "tasks:toggle",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const body = await request.json();
    const { taskId, isCompleted, userStatusId, eventName } = body;

    const sanitizedTaskId = sanitizeString(taskId, 100);
    if (!sanitizedTaskId) {
      return NextResponse.json(
        { success: false, message: "A valid taskId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = await resolveDbUserId(session?.user?.email);
    const targetDoc = await findUserStatusBlueprint({
      userStatusId,
      eventName,
      userId,
    });

    if (!targetDoc) {
      return NextResponse.json(
        { success: false, message: "No event blueprint found to update" },
        { status: 404 }
      );
    }

    // Ownership check: if user is signed in, ensure they own the blueprint
    if (userId && !targetDoc.userId.equals(userId)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to modify tasks on this blueprint" },
        { status: 403 }
      );
    }

    // Use optimized model instance method toggleTask
    const taskFound = targetDoc.toggleTask(sanitizedTaskId, isCompleted);
    if (!taskFound) {
      return NextResponse.json(
        {
          success: false,
          message: `Task with id '${sanitizedTaskId}' not found in event blueprint '${targetDoc.eventName}'`,
        },
        { status: 404 }
      );
    }

    await targetDoc.save();

    const indexMatch = String(sanitizedTaskId).match(/^task-(\d+)$/i);
    const parsedIdx = indexMatch ? parseInt(indexMatch[1], 10) : -1;
    const updatedTaskObj = (targetDoc.prepCalendarTasks || []).find(
      (t: any, idx: number) => t.id === sanitizedTaskId || idx === parsedIdx
    );

    return NextResponse.json({
      success: true,
      message: `Task '${updatedTaskObj?.title || sanitizedTaskId}' status updated to ${updatedTaskObj?.isCompleted ? "completed" : "pending"}`,
      taskId: sanitizedTaskId,
      isCompleted: updatedTaskObj?.isCompleted,
      updatedTask: updatedTaskObj,
      userStatusId: targetDoc._id,
      eventName: targetDoc.eventName,
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Internal server error updating task");
  }
}

export async function POST(request: Request) {
  return handleTaskToggle(request);
}

export async function PATCH(request: Request) {
  return handleTaskToggle(request);
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, {
    maxRequests: 100,
    windowSeconds: 60,
    bucketPrefix: "tasks:get",
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get("eventName");
    const userStatusId = searchParams.get("userStatusId");

    const session = await getServerSession(authOptions);
    const userId = await resolveDbUserId(session?.user?.email);

    const doc = await findUserStatusBlueprint({
      userStatusId,
      eventName,
      userId,
    });

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const tasks = doc.prepCalendarTasks || [];
    const completedCount = tasks.filter((t: any) => Boolean(t.isCompleted)).length;

    return NextResponse.json({
      success: true,
      eventName: doc.eventName,
      userStatusId: doc._id,
      totalTasks: tasks.length,
      completedCount,
      prepCalendarTasks: tasks,
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to fetch tasks");
  }
}

