import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getBillReveal, getCommunitySplit } from "@/lib/civic/engage";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

/**
 * How the user's reps voted on a bill. The only way pages learn this, so a rep's vote stays out of
 * the page until the user votes, or asks to see it.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to compare with your reps." }, { status: 401 });
  }
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug || slug.length > 80) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const reps = await getBillReveal(session.user.id, slug);
  if (reps === null) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }
  return NextResponse.json({ reps, split: await getCommunitySplit(session.user.id, slug) });
}
