// app/api/cookie/set-cookie-redirect/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { SignJWT } from "jose";
import { ratelimit } from "@/lib/ratelimiter";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  console.log("ip address", ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip
  );
  if (!success) {
    console.log("limit", limit);
    return NextResponse.json({ error: "Rate Limit Error" }, { status: 429 });
  }
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/api/auth/signin", request.url));
    }

    // Fetch user's role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/api/auth/signin", request.url));
    }

    return NextResponse.json("response successful", { status: 202 });
  } catch (error) {
    console.error("Error setting role cookie:", error);
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }
}
