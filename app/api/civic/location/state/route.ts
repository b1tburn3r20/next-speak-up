import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { getUserLocation, refreshUserAlignment } from "@/lib/civic/users";
import { parseStateDistricts, SUPPORTED_CITIES } from "@/lib/civic/state-logic";
import { saveStateLocation } from "@/lib/civic/state";

const schema = z.object({
  lower: z.string().max(4).nullable(),
  upper: z.string().max(4).nullable(),
  inDesMoines: z.boolean(),
});

/** For someone who chose Iowa by hand. Saves only district numbers, never an address. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), userId);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a real district." }, { status: 400 });
  const location = await getUserLocation(userId);
  if (location?.regionCode !== "IA") {
    return NextResponse.json({ error: "Set your location to Iowa first." }, { status: 400 });
  }
  const districts = parseStateDistricts(parsed.data);
  if ((parsed.data.lower && !districts.lower) || (parsed.data.upper && !districts.upper)) {
    return NextResponse.json({ error: "That district doesn't exist." }, { status: 400 });
  }
  const saved = await saveStateLocation(
    userId,
    { ...districts, placeGeoid: parsed.data.inDesMoines ? SUPPORTED_CITIES.ia["des-moines"].placeGeoid : null },
    "MANUAL",
  );
  if (!saved) return NextResponse.json({ error: "That district doesn't exist." }, { status: 400 });
  await refreshUserAlignment(userId);
  return NextResponse.json({ ok: true });
}
