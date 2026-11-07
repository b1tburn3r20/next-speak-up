import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { refreshUserAlignment } from "@/lib/civic/users";
import { getUserState, saveStateLocation } from "@/lib/civic/state";
import { cityByKey, validDistrict } from "@/lib/civic/states";

const schema = z.object({
  lower: z.string().max(4).nullable(),
  upper: z.string().max(4).nullable(),
  /** A city's key, like "des-moines", or null for anywhere else. */
  city: z.string().max(60).nullable(),
});

/** For someone who chose their state by hand. Saves only district numbers and a city, never an address. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), userId);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a real district." }, { status: 400 });
  const state = await getUserState(userId);
  if (!state) return NextResponse.json({ error: "Set your location to a state we cover first." }, { status: 400 });
  const { lower, upper, city } = parsed.data;
  const seats = { lower: validDistrict(state, "LOWER", lower), upper: validDistrict(state, "UPPER", upper) };
  const place = city ? cityByKey(state, city) : null;
  if ((lower && !seats.lower) || (upper && !seats.upper) || (city && !place)) {
    return NextResponse.json({ error: "That district or city isn't one we know." }, { status: 400 });
  }
  const saved = await saveStateLocation(userId, state, { ...seats, placeGeoid: place?.placeGeoid ?? null }, "MANUAL");
  if (!saved) return NextResponse.json({ error: "That district doesn't exist." }, { status: 400 });
  await refreshUserAlignment(userId);
  return NextResponse.json({ ok: true });
}
