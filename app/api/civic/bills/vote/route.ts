import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { castBillVote, removeBillVote } from "@/lib/civic/users";
import { getHudProgress } from "@/lib/civic/xp";

const voteSchema = z.object({
  slug: z.string().min(1).max(80),
  position: z.enum(["YEA", "NAY", "PRESENT"]).nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }
  const { slug, position } = parsed.data;
  const found = position
    ? await castBillVote(session.user.id, slug, position)
    : await removeBillVote(session.user.id, slug);
  if (!found) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }
  return NextResponse.json({ position, progress: await getHudProgress(session.user.id) });
}
