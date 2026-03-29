import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { getRepresentationMetrics } from "@/lib/services/dashboard/user-personalized-dashboard";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = getUserRole(session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const identifier = session.user.id;
    const rateLimitResult = await checkRateLimit("general", userRole, identifier);

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

    const data = await getRepresentationMetrics();

    if ("error" in data) {
      return NextResponse.json({ error: data.error }, { status: data.status });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching representation metrics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch representation metrics",
      },
      { status: 500 }
    );
  }
}
