import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMemberSponsoredList } from "@/lib/civic/people";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

/**
 * Bills a member sponsored, newest first, for one topic or only those that became law. Public, like
 * the member page it's opened from.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("general", getUserRole(session), session?.user?.id ?? `sponsored:${ip}`);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const params = request.nextUrl.searchParams;
  const personId = Number(params.get("personId"));
  const area = params.get("area");
  const page = Number(params.get("page") ?? 1);
  if (!Number.isInteger(personId) || personId <= 0 || !Number.isInteger(page) || page < 1 || page > 100) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (area && !policyAreaByName(area)) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  return NextResponse.json(await getMemberSponsoredList(personId, { policyArea: area ?? undefined, becameLaw: params.get("law") === "1", page }));
}
