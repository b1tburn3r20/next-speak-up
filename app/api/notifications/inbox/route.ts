import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getInbox, markInboxRead } from "@/lib/notifications/inbox";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

/** What the bell lists: notifications sent to you, newest first. Signed out, nothing. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [], unread: 0 });
  return NextResponse.json(await getInbox(session.user.id));
}

/** Opening the bell marks what's in it read. */
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  await markInboxRead(session.user.id);
  return NextResponse.json({ ok: true });
}
