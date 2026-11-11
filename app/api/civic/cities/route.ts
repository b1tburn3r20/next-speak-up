import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listCities } from "@/lib/civic/city-registry";
import { stateByKey } from "@/lib/civic/states";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

/** Public: a state's cities by name, for picking where you live. Only names and keys, which the list page shows anyway. */
export async function GET(request: NextRequest) {
  const state = stateByKey(request.nextUrl.searchParams.get("state") ?? "");
  if (!state) return NextResponse.json({ error: "Not a state we cover." }, { status: 404 });
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (query.length < 2) return NextResponse.json({ cities: [] });

  const session = await getServerSession(authOptions);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("general", getUserRole(session), session?.user?.id ?? `cities:${ip}`);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { cities } = await listCities(state, { q: query, take: 8 });
  return NextResponse.json({ cities: cities.map((city) => ({ key: city.slug, name: city.name, population: city.population })) });
}
