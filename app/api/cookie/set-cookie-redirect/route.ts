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

    // Create encrypted JWT using NEXTAUTH_SECRET
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const now = Math.floor(Date.now() / 1000);

    const roleToken = await new SignJWT({
      role: user.role || "user",
      userId: session.user.id,
      iat: now,
      exp: now + 60 * 60,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(secret);

    // Get the original URL they were trying to access
    const url = new URL(request.url);
    const returnTo = url.searchParams.get("returnTo") || "/";

    // Create redirect response
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    // Set the encrypted cookie on the redirect response
    response.cookies.set("user-role-token", roleToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 2, // 2 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting role cookie:", error);
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }
}
