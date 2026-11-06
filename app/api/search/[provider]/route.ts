import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { providerFor } from "@/lib/search/registry";

const MAX_QUERY_LENGTH = 100;
const RESULTS_PER_GROUP = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getServerSession(authOptions);
  const provider = providerFor((await params).provider, session);
  // The same answer for "doesn't exist" and "not allowed", so this can't reveal what's restricted.
  if (!provider) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (query.length < provider.minQueryLength) return NextResponse.json({ results: [] });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("general", getUserRole(session), session?.user?.id ?? `search:${ip}`);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const results = await provider.search({ query, session, limit: RESULTS_PER_GROUP });
    return NextResponse.json({ results });
  } catch (error) {
    console.error(`Search failed for ${provider.id}:`, error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Search isn't working right now." }, { status: 500 });
  }
}
