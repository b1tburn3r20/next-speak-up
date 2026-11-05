import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { setBillFollow } from "@/lib/civic/users";

const followSchema = z.object({
  slug: z.string().min(1).max(80),
  following: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to follow bills." }, { status: 401 });
  }
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = followSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const found = await setBillFollow(session.user.id, parsed.data.slug, parsed.data.following);
  if (!found) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }
  return NextResponse.json({ following: parsed.data.following });
}
