import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCityContext } from "@/lib/civic/city-registry";
import { getUserState, saveHomeCity } from "@/lib/civic/state";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const schema = z.object({
  /** A city's key in the state they live in, like "pella", or null for not living in a city. */
  city: z.string().max(60).nullable(),
});

/** Someone says which city they live in. Only the city is saved, and their districts are left alone. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), userId);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a city." }, { status: 400 });
  const state = await getUserState(userId);
  if (!state) return NextResponse.json({ error: "Set your location to a state we cover first." }, { status: 400 });
  const city = parsed.data.city ? await getCityContext(state, parsed.data.city) : null;
  if (parsed.data.city && !city?.placeGeoid) {
    return NextResponse.json({ error: `That isn't a city in ${state.name}.` }, { status: 400 });
  }
  if (!(await saveHomeCity(userId, state, city?.placeGeoid ?? null))) {
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, city: city ? { key: city.key, name: city.name } : null });
}
