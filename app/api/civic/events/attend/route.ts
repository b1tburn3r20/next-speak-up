import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { canReportAttendance } from "@/lib/civic/state-logic";
import { awardAttendXp } from "@/lib/civic/xp";
import prisma from "@/prisma/client";

const schema = z.object({ eventId: z.number().int().positive() });

/** Someone says they went to a meeting. It's their word, so it's shown as self-reported everywhere. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), userId);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid meeting." }, { status: 400 });
  const { eventId } = parsed.data;
  const event = await prisma.civicEvent.findUnique({ where: { id: eventId }, select: { startsAt: true, status: true } });
  if (!event) return NextResponse.json({ error: "That meeting doesn't exist." }, { status: 404 });
  if (!canReportAttendance(event, new Date())) {
    return NextResponse.json({ error: "You can say you went from when it starts until two weeks later." }, { status: 400 });
  }
  await prisma.$transaction(async (tx) => {
    const existing = await tx.civicAction.findFirst({ where: { userId, eventId, kind: "ATTENDED_EVENT" }, select: { id: true } });
    if (!existing) await tx.civicAction.create({ data: { userId, eventId, kind: "ATTENDED_EVENT" } });
    await awardAttendXp(tx, userId, eventId);
  });
  return NextResponse.json({ ok: true });
}
