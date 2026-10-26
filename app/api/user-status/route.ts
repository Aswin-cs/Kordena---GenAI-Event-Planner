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
      endDate,
      eventDate,
      selectedPlan,
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

    // Create UserStatus document in MongoDB
    const userStatus = await UserStatus.create({
      userId: resolvedUserId,
      eventName: trimmedEventName,
      eventType: resolvedEventType,
      budget: resolvedBudget,
      guestCount: resolvedGuestCount,
      endDate: parsedDate,
      selectedPlan: selectedPlan || "Professional Suite",
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
