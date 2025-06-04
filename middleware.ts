// middleware.ts (at project root)
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  console.log("=== MIDDLEWARE RUNNING ===");
  console.log("Path:", request.nextUrl.pathname);

  try {
    const token = await getToken({ req: request });
    console.log("Token retrieved successfully:", !!token);
    console.log("Token role:", token?.role);
  } catch (error) {
    console.log("Error getting token:", error);
  }

  console.log("=== MIDDLEWARE COMPLETE ===");
  // Don't block anything for now, just log
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
