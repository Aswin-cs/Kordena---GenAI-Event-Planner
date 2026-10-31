import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "./auth";
import User, { IUser } from "../models/User";
import UserStatus from "../models/UserStatus.model";

/**
 * Escapes special characters in a string to safely use inside a RegExp
 * without exposing the server to ReDoS (Regular Expression Denial of Service).
 */
export function escapeRegex(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips dangerous control characters and truncates strings to a maximum safe length.
 */
export function sanitizeString(val: any, maxLength = 255): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and constrains numeric inputs within safe operational ranges.
 */
export function clampNumber(
  val: any,
  min: number,
  max: number,
  defaultValue: number
): number {
  const num = Number(val);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
}

/**
 * Verifies that the incoming request has a valid authenticated NextAuth session.
 * If unauthorized, returns a 401 Unauthorized NextResponse.
 * If authorized, returns { authorized: true, session, userEmail, userName }.
 */
export async function requireAuthSession(
  customMessage = "Unauthorized: You must be signed in to access AI features."
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return {
        authorized: false as const,
        session: null,
        response: NextResponse.json(
          {
            success: false,
            message: customMessage,
            code: "UNAUTHORIZED",
          },
          { status: 401 }
        ),
      };
    }
    return {
      authorized: true as const,
      session,
      userEmail: session.user.email.toLowerCase().trim(),
      userName: session.user.name || "Event Planner",
      response: null,
    };
  } catch (err: any) {
    if (!err?.message?.includes("outside a request scope")) {
      console.warn("[Security] Auth session check failed:", err?.message || err);
    }
    return {
      authorized: false as const,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          message: customMessage,
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }
}

/**
 * Retrieves the authenticated database User document from the NextAuth session.
 * Prevents client-side user impersonation or IDOR attacks.
 */
export async function getAuthenticatedUser(): Promise<IUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }
    const email = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    return user;
  } catch (err) {
    console.error("[Security] Error retrieving authenticated user:", err);
    return null;
  }
}

/**
 * Sanitizes server error messages before returning them to client responses,
 * preventing stack traces, internal paths, and DB infrastructure details from leaking.
 */
export function safeErrorResponse(
  error: any,
  clientMessage = "An unexpected error occurred",
  status = 500
): NextResponse {
  // Always log full error details on the server for auditing and diagnostics
  console.error(`[Server Error ${status}]:`, error);

  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = isDev && error?.message ? error.message : clientMessage;

  return NextResponse.json(
    {
      success: false,
      message: errorMessage,
    },
    { status }
  );
}

/**
 * Resolves the database user ObjectId with a unified fallback chain:
 * 1. Authenticated session email -> User lookup (optionally creates user if missing)
 * 2. Explicit userId parameter -> Validates ObjectId and verifies existence
 * 3. Fallback guest user ("planner@kordena.ai")
 */
export async function resolveDbUserId(
  sessionEmail?: string | null,
  explicitUserId?: string | null,
  options?: { createIfMissing?: boolean; userName?: string; userImage?: string }
): Promise<mongoose.Types.ObjectId | null> {
  if (sessionEmail) {
    const email = sessionEmail.toLowerCase().trim();
    const dbUser = await User.findOne({ email }).select("_id").lean();
    if (dbUser) return dbUser._id as mongoose.Types.ObjectId;
    if (options?.createIfMissing) {
      const newUser = await User.create({
        name: sanitizeString(options?.userName, 100) || "Event Planner",
        email,
        image: options?.userImage || "",
      });
      return newUser._id;
    }
  }

  if (explicitUserId && mongoose.Types.ObjectId.isValid(explicitUserId)) {
    const existing = await User.findById(explicitUserId).select("_id").lean();
    if (existing) return existing._id as mongoose.Types.ObjectId;
  }

  const guest = await User.findOne({ email: "planner@kordena.ai" }).select("_id").lean();
  if (guest) return guest._id as mongoose.Types.ObjectId;

  if (options?.createIfMissing) {
    const fallbackUser = await User.create({
      name: "Guest Planner",
      email: "planner@kordena.ai",
      image: "",
    });
    return fallbackUser._id;
  }

  return null;
}

/**
 * Resilient 3-tier lookup for UserStatus documents:
 * 1. By direct document ID
 * 2. By event name regex (filtered by user if authenticated, then global fallback)
 * 3. Most recently modified blueprint for the user
 */
export async function findUserStatusBlueprint(params: {
  userStatusId?: string | null;
  eventName?: string | null;
  userId?: mongoose.Types.ObjectId | null;
}) {
  const { userStatusId, eventName, userId } = params;

  // 1. By ID
  if (userStatusId && mongoose.Types.ObjectId.isValid(userStatusId)) {
    const doc = await UserStatus.findById(userStatusId);
    if (doc) return doc;
  }

  // 2. By eventName
  if (eventName) {
    const safeName = escapeRegex(sanitizeString(eventName, 120));
    const query: Record<string, any> = {
      eventName: { $regex: new RegExp(`^${safeName}$`, "i") },
    };
    if (userId) query.userId = userId;
    let doc = await UserStatus.findOne(query).sort({ updatedAt: -1 });
    if (!doc && userId) {
      doc = await UserStatus.findOne({
        eventName: { $regex: new RegExp(`^${safeName}$`, "i") },
      }).sort({ updatedAt: -1 });
    }
    if (doc) return doc;
  }

  // 3. Fallback to latest for user
  if (userId) {
    return await UserStatus.findLatestByUser(userId);
  }

  return null;
}

/**
 * Common update payload for event blueprints across API routes (chat, user-status PATCH).
 */
export interface BlueprintUpdateData {
  budgetBreakdown?: any[];
  prepCalendarTasks?: any[];
  dayOfRunOfShow?: any[];
  requirements?: string[];
  budget?: number;
  guestCount?: number;
}

/**
 * Efficiently applies blueprint field updates to an active UserStatus Mongoose document.
 * Eliminates duplicate array assignment and modified-flag boilerplate across API routes.
 */
export function applyBlueprintUpdates(
  targetDoc: any,
  updates: BlueprintUpdateData
): boolean {
  if (!targetDoc || !updates) return false;
  let modified = false;

  if (Array.isArray(updates.budgetBreakdown)) {
    targetDoc.budgetBreakdown = updates.budgetBreakdown;
    targetDoc.markModified("budgetBreakdown");
    modified = true;
  }
  if (Array.isArray(updates.prepCalendarTasks)) {
    targetDoc.prepCalendarTasks = updates.prepCalendarTasks;
    targetDoc.markModified("prepCalendarTasks");
    modified = true;
  }
  if (Array.isArray(updates.dayOfRunOfShow)) {
    targetDoc.dayOfRunOfShow = updates.dayOfRunOfShow;
    targetDoc.markModified("dayOfRunOfShow");
    modified = true;
  }
  if (Array.isArray(updates.requirements)) {
    targetDoc.requirements = updates.requirements;
    targetDoc.markModified("requirements");
    modified = true;
  }
  if (typeof updates.budget === "number" && !isNaN(updates.budget)) {
    targetDoc.budget = clampNumber(updates.budget, 0, 1_000_000_000, targetDoc.budget);
    modified = true;
  }
  if (typeof updates.guestCount === "number" && !isNaN(updates.guestCount) && updates.guestCount >= 1) {
    targetDoc.guestCount = clampNumber(updates.guestCount, 1, 1_000_000, targetDoc.guestCount);
    modified = true;
  }

  return modified;
}
