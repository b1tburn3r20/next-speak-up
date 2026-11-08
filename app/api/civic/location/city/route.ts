import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { saveUserWard } from "@/lib/civic/city";
import { validWard } from "@/lib/civic/city-logic";
import { getUserState } from "@/lib/civic/state";
import { cityByKey } from "@/lib/civic/states";
import { refreshUserAlignment } from "@/lib/civic/users";

const schema = z.object({ city: z.string().max(60), ward: z.string().max(4).nullable() });

/** Saves someone's ward, or clears it. Only a number is kept, never an address. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), userId);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a real ward." }, { status: 400 });
  const state = await getUserState(userId);
  const city = state ? cityByKey(state, parsed.data.city) : null;
  if (!state || !city) return NextResponse.json({ error: "Set your location to this city's state first." }, { status: 400 });
  const ward = validWard(city, parsed.data.ward);
  if (parsed.data.ward && !ward) return NextResponse.json({ error: "That ward doesn't exist." }, { status: 400 });
  if (!(await saveUserWard(userId, city, state.regionCode, ward))) {
    return NextResponse.json({ error: "That ward isn't loaded yet." }, { status: 400 });
  }
  await refreshUserAlignment(userId);
  return NextResponse.json({ ok: true });
}
