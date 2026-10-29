import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import UserStatus, { IPrepCalendarTask } from "@/models/UserStatus.model";
import User from "@/models/User";

/**
 * Handles toggling or explicitly setting the isCompleted status of a prep calendar task.
 */
async function handleTaskToggle(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { taskId, isCompleted, userStatusId, eventName } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "taskId is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    let userId: any = null;
    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
      if (dbUser) {
        userId = dbUser._id;
      }
    }

    let targetDoc: any = null;

    // 1. Try finding by userStatusId if provided
    if (userStatusId) {
      targetDoc = await UserStatus.findById(userStatusId);
    }

    // 2. Try finding by eventName
    if (!targetDoc && eventName) {
      const query: Record<string, any> = {
        eventName: { $regex: new RegExp(`^${eventName.trim()}$`, "i") },
      };
      if (userId) query.userId = userId;
      targetDoc = await UserStatus.findOne(query).sort({ updatedAt: -1 });

      // Fallback without userId if guest or session is different
      if (!targetDoc) {
        targetDoc = await UserStatus.findOne({
          eventName: { $regex: new RegExp(`^${eventName.trim()}$`, "i") },
        }).sort({ updatedAt: -1 });
      }
    }

    // 3. Fallback to latest doc
    if (!targetDoc) {
      const query: Record<string, any> = userId ? { userId } : {};
      targetDoc = await UserStatus.findOne(query).sort({ updatedAt: -1 });
    }

    if (!targetDoc) {
      return NextResponse.json(
        { success: false, message: "No event blueprint found to update" },
        { status: 404 }
      );
    }

    // Find the task inside prepCalendarTasks
    const tasks: IPrepCalendarTask[] = targetDoc.prepCalendarTasks || [];
    let taskFound = false;
    let newCompletedState = false;
    let updatedTaskObj: any = null;

    // Check if taskId matches directly, or matches index pattern (e.g. "task-0", "task-1")
    const indexMatch = String(taskId).match(/^task-(\d+)$/i);
    const parsedIdx = indexMatch ? parseInt(indexMatch[1], 10) : -1;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const matchById = t.id && t.id === taskId;
      const matchByIndex = i === parsedIdx;

      if (matchById || matchByIndex) {
        newCompletedState =
          isCompleted !== undefined ? Boolean(isCompleted) : !Boolean(t.isCompleted);
        t.isCompleted = newCompletedState;
        updatedTaskObj = t;
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return NextResponse.json(
        {
          success: false,
          message: `Task with id '${taskId}' not found in event blueprint '${targetDoc.eventName}'`,
        },
        { status: 404 }
      );
    }

    // Mark modified and persist to MongoDB
    targetDoc.markModified("prepCalendarTasks");
    await targetDoc.save();

    return NextResponse.json({
      success: true,
      message: `Task '${updatedTaskObj.title || taskId}' status updated to ${newCompletedState ? "completed" : "pending"}`,
      taskId,
      isCompleted: newCompletedState,
      updatedTask: updatedTaskObj,
      userStatusId: targetDoc._id,
      eventName: targetDoc.eventName,
    });
  } catch (error: any) {
    console.error("[Task Toggle API] Error toggling task:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleTaskToggle(request);
}

export async function PATCH(request: Request) {
  return handleTaskToggle(request);
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get("eventName");
    const userStatusId = searchParams.get("userStatusId");

    const session = await getServerSession(authOptions);
    let userId: any = null;
    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
      if (dbUser) userId = dbUser._id;
    }

    let filter: Record<string, any> = {};
    if (userStatusId) {
      filter._id = userStatusId;
    } else if (eventName) {
      filter.eventName = { $regex: new RegExp(`^${eventName.trim()}$`, "i") };
      if (userId) filter.userId = userId;
    } else if (userId) {
      filter.userId = userId;
    }

    const doc = await UserStatus.findOne(filter).sort({ updatedAt: -1 }).lean();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const tasks = (doc as any).prepCalendarTasks || [];
    const completedCount = tasks.filter((t: any) => Boolean(t.isCompleted)).length;

    return NextResponse.json({
      success: true,
      eventName: (doc as any).eventName,
      userStatusId: (doc as any)._id,
      totalTasks: tasks.length,
      completedCount,
      prepCalendarTasks: tasks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

