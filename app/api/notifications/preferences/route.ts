import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { NOTIFY_PREF_NAMES } from "@/lib/notifications/plan";
import { getNotifySettings, setNotifyPrefs } from "@/lib/notifications/subscriptions";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const changeSchema = z
  .object({
    ...Object.fromEntries(NOTIFY_PREF_NAMES.map((name) => [name, z.boolean().optional()])),
    // One topic's notifications, without untracking it.
    topic: z.object({ name: z.string().refine((name) => policyAreaByName(name) !== null), muted: z.boolean() }).optional(),
  })
  .strict();

/** Someone's own notification choices, and how many of their browsers get them. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json(await getNotifySettings(session.user.id));
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await setNotifyPrefs(session.user.id, parsed.data as Parameters<typeof setNotifyPrefs>[1]);
  return NextResponse.json(await getNotifySettings(session.user.id));
}
