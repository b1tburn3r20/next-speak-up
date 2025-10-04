import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import {
  getSpecificUserPreferences,
  setUserPreference,
} from "@/lib/services/user-preferances";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userRole = getUserRole(session);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get client IP address for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0].trim() || realIp || null;

    // Use user ID as identifier for rate limiting
    const identifier = session.user.id;

    // Check rate limit for general endpoint (not TTS specific)
    const rateLimitResult = await checkRateLimit(
      "general",
      userRole,
      identifier
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || "Rate limit exceeded",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { voice } = body;

    if (!voice || typeof voice !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid required field: voice" },
        { status: 400 }
      );
    }

    // Set the TTS voice preference
    await setUserPreference(session.user.id, "ttsVoicePreference", voice);

    return NextResponse.json(
      {
        success: true,
        message: "TTS voice preference updated successfully",
        voice: voice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting TTS voice preference:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to set TTS voice preference",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get TTS voice preference using your existing function
    const preferences = await getSpecificUserPreferences(session.user.id, [
      "ttsVoicePreference",
    ]);

    return NextResponse.json(
      {
        ttsVoicePreference: preferences.ttsVoicePreference || "heart", // Default to "heart" if not set
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting TTS voice preference:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get TTS voice preference",
      },
      { status: 500 }
    );
  }
}
