import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { skipBillGate } from "@/lib/civic/users";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const schema = z.object({ slug: z.string().min(1).max(80) });

/** Remembers that someone chose to read this bill without voting first. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const found = await skipBillGate(session.user.id, parsed.data.slug);
  if (!found) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
