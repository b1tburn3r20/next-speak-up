import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runDispatch } from "@/lib/notifications/dispatch";
import { pushConfigured } from "@/lib/notifications/web-push";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/** One pass of the notification sender, for a scheduler. Needs CRON_SECRET as a bearer token. */
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ error: "VAPID keys aren't set." }, { status: 503 });
  return NextResponse.json(await runDispatch());
}
