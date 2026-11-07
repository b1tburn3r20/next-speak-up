import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requirePermission } from "@/lib/auth/require-permission";
import { hideFromLeaderboard, setLeaderboardOptIn } from "@/lib/civic/leaderboard";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const joinSchema = z.object({ optIn: z.boolean() });
const hideSchema = z.object({ userId: z.string().min(1).max(40) });

/** Joining or leaving is always someone's own choice. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await setLeaderboardOptIn(session.user.id, parsed.data.optIn);
  return NextResponse.json({ optIn: parsed.data.optIn });
}

/** A moderator takes a name off the board. */
export async function DELETE(request: NextRequest) {
  const access = await requirePermission("forum.moderate");
  if ("denied" in access) return access.denied;
  const parsed = hideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await hideFromLeaderboard(parsed.data.userId);
  return NextResponse.json({ hidden: true });
}
