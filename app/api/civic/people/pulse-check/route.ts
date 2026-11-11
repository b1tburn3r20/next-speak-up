import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPulseCheckVotes } from "@/lib/civic/engage";
import { PULSE_SIZES } from "@/lib/civic/pulse-check";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const MAX_SLUGS = Math.max(...PULSE_SIZES);

/**
 * A pulse check's summary: how a member voted on the bills you just voted on. Only bills you've voted
 * on come back, so it can't be used to see a member's vote first.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const personId = Number(request.nextUrl.searchParams.get("personId"));
  const slugs = (request.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug))
    .slice(0, MAX_SLUGS);
  if (!Number.isInteger(personId) || personId <= 0 || slugs.length === 0) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  return NextResponse.json({ votes: await getPulseCheckVotes(session.user.id, personId, slugs) });
}
