import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import prisma from "@/prisma/client";

// Helper function to get client IP address
function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp && firstIp !== "unknown") return firstIp;
  }

  if (realIp && realIp !== "unknown") return realIp;

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userRole = getUserRole(session);

    // Get client IP address
    const ipAddress = getClientIP(request);

    // Reject request if we can't identify the user or IP
    if (!session?.user?.id && !ipAddress) {
      return NextResponse.json(
        { error: "Unable to identify request source" },
        { status: 400 }
      );
    }

    // Use user ID if available, otherwise use IP address
    const identifier = session?.user?.id || ipAddress!;

    // Check rate limit for general endpoint
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
    const { feature, pathWhereBugSubmitted } = body;

    if (!feature || feature.trim().length === 0) {
      return NextResponse.json(
        { error: "Feature description is required" },
        { status: 400 }
      );
    }

    // Only authenticated users can submit feature suggestions
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required to submit feature suggestions" },
        { status: 401 }
      );
    }

    // Create feature suggestion
    const featureSuggestion = await prisma.featureSuggestion.create({
      data: {
        feature: feature.trim(),
        userId: session.user.id,
        userRole: userRole,
        // You can add pathWhereBugSubmitted as a field if needed
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feature suggestion submitted successfully",
        id: featureSuggestion.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting feature suggestion:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit feature suggestion",
      },
      { status: 500 }
    );
  }
}
