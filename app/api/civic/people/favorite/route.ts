import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { setMemberFavorite } from "@/lib/civic/people";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const favoriteSchema = z.object({
  bioguideId: z.string().min(1).max(20),
  favorite: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save members." }, { status: 401 });
  }
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const found = await setMemberFavorite(
    session.user.id,
    parsed.data.bioguideId,
    parsed.data.favorite,
  );
  if (!found) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  return NextResponse.json({ favorite: parsed.data.favorite });
}
