import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, image, googleId } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();

      // Upsert: Find user by email or create if they don't exist yet
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          $set: {
            name: name || "Event Planner",
            image: image || "",
            ...(googleId ? { googleId } : {}),
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "User saved successfully",
        user,
      });
    } catch (dbError) {
      // If MongoDB is not running locally or connection is unavailable,
      // return a graceful success response so frontend operation continues uninterrupted
      console.warn("MongoDB connection notice (continuing with session):", dbError);
      return NextResponse.json({
        success: true,
        persisted: false,
        message: "Session active (MongoDB offline)",
        user: {
          name: name || "Event Planner",
          email: email.toLowerCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, user });
    } catch (dbError) {
      return NextResponse.json(
        { success: false, error: "Database offline" },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
