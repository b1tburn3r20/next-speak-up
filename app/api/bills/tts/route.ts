import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { headers } from "next/headers";

// Helper function to get client IP address
function getClientIP(request: NextRequest): string | null {
  // Try to get IP from various headers in order of preference
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  // x-forwarded-for can contain multiple IPs, get the first one (original client)
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp && firstIp !== "unknown") return firstIp;
  }
  // Try other headers
  if (realIp && realIp !== "unknown") return realIp;
  // Return null if no valid IP found
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

    // Check rate limit for TTS endpoint
    const rateLimitResult = await checkRateLimit("tts", userRole, identifier);

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

    // TTS endpoint allows guests with limited access
    if (userRole === "unauthenticated") {
      // Guests can use TTS but with heavy rate limiting
      console.log(
        `Guest user accessing TTS with rate limit from IP: ${
          ipAddress || "authenticated user"
        }`
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      input,
      voice = "heart",
      response_format = "mp3",
      speed = 1.0,
      word_timestamps = true,
    } = body;

    if (!input) {
      return NextResponse.json(
        { error: "Missing required field: input" },
        { status: 400 }
      );
    }

    // Make request to LemonFox API
    const response = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        voice,
        response_format,
        speed,
        word_timestamps,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LemonFox API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status }
      );
    }

    // If word_timestamps is true, we expect JSON response with audio data and timestamps
    if (word_timestamps) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // For audio-only response, stream the audio back
      const audioBuffer = await response.arrayBuffer();

      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": `audio/${response_format}`,
          "Content-Length": audioBuffer.byteLength.toString(),
          // Add rate limit headers for client visibility
          "X-RateLimit-Limit": rateLimitResult.limit?.toString() || "unlimited",
          "X-RateLimit-Remaining":
            rateLimitResult.remaining?.toString() || "unlimited",
          "X-RateLimit-Reset": rateLimitResult.reset?.toString() || "0",
        },
      });
    }
  } catch (error) {
    console.error("Error generating TTS:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate speech",
      },
      { status: 500 }
    );
  }
}
