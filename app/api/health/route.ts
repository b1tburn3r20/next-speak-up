import { NextResponse } from "next/server";
import prisma from "@/prisma/client";

/** For Railway's health check. It says only whether the app can reach its database. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
