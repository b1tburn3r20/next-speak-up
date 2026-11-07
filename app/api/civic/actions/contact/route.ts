import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { recordContact } from "@/lib/civic/engage";
import { getHudProgress } from "@/lib/civic/xp";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const schema = z.object({ slug: z.string().min(1).max(80), personId: z.number().int().positive() });

/** Someone says they contacted their rep about a bill. We take their word, and say so. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const earned = await recordContact(session.user.id, parsed.data.slug, parsed.data.personId);
  if (earned === null) return NextResponse.json({ error: "That isn't one of your reps." }, { status: 404 });
  return NextResponse.json({ earned, progress: await getHudProgress(session.user.id) });
}
