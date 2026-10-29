import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "./auth";
import User, { IUser } from "../models/User";

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
