import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import {
  districtFromAddress,
  districtFromCoordinates,
  isValidCoordinate,
  type StateSeats,
} from "@/lib/civic/location";
import { saveStateLocation } from "@/lib/civic/state";
import { stateByRegion } from "@/lib/civic/states";
import { DataNotLoadedError, refreshUserAlignment, saveUserLocation, type LocationSource } from "@/lib/civic/users";
import { describeError } from "@/lib/describe-error";

// Coordinates and addresses are used for the lookup and then discarded. Only the state and
// district are saved, and that's only for signed-in users.
const lookupSchema = z.union([
  z.object({ lat: z.number(), lng: z.number() }),
  z.object({ address: z.string().trim().min(5).max(200) }),
  z.object({
    regionCode: z.string().length(2).toUpperCase(),
    // Someone who doesn't know their district still gets their senators.
    districtCode: z.string().min(1).max(4).nullable(),
    // Sent when the browser asked the Census itself (components/onboarding/census-lookup.ts),
    // because Railway's servers can't reach it. Trusted no more than choosing by hand: the district
    // still has to exist, and the seats are only ever the person's own.
    source: z.enum(["BROWSER", "ADDRESS"]).optional(),
    stateSeats: z
      .object({
        upper: z.string().regex(/^\d{1,3}$/).nullable(),
        lower: z.string().regex(/^\d{1,3}$/).nullable(),
        placeGeoid: z.string().regex(/^\d{7}$/).nullable(),
      })
      .optional(),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit(
    "general",
    getUserRole(session),
    session?.user?.id ?? `location:${ip}`,
  );
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a full street address." }, { status: 400 });
  }
  const input = parsed.data;

  let resolved: { regionCode: string; districtCode: string | null; stateSeats?: StateSeats } | null;
  let source: LocationSource;
  try {
    if ("lat" in input) {
      if (!isValidCoordinate(input.lat, input.lng)) {
        return NextResponse.json({ error: "Invalid location." }, { status: 400 });
      }
      resolved = await districtFromCoordinates(input.lat, input.lng);
      source = "BROWSER";
    } else if ("address" in input) {
      resolved = await districtFromAddress(input.address);
      source = "ADDRESS";
    } else if ("regionCode" in input) {
      resolved = {
        regionCode: input.regionCode,
        districtCode: input.districtCode,
        ...(input.stateSeats ? { stateSeats: input.stateSeats as StateSeats } : {}),
      };
      source = input.source ?? "MANUAL";
    } else {
      return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    }
  } catch (error) {
    console.error("Location lookup failed:", describeError(error));
    // 503, not 502: Cloudflare swaps a 502 for its own "Bad gateway" page, which hides this message
    // and the way to choose a state and district by hand.
    return NextResponse.json(
      { error: "The location service isn't responding. Choose your state and district instead." },
      { status: 503 },
    );
  }

  if (!resolved) {
    return NextResponse.json(
      { error: "We couldn't find a district there. Choose your state and district instead." },
      { status: 404 },
    );
  }

  if (session?.user?.id) {
    let saved: boolean;
    try {
      saved = await saveUserLocation(session.user.id, resolved.regionCode, resolved.districtCode, source);
    } catch (error) {
      if (!(error instanceof DataNotLoadedError)) throw error;
      return NextResponse.json(
        { error: "We're still loading Congress's members and districts. Try again in a little while." },
        { status: 503 },
      );
    }
    if (!saved) {
      return NextResponse.json({ error: "That district doesn't exist." }, { status: 400 });
    }
    // A lookup also gives their statehouse seats, in states we cover. Choosing by hand doesn't, so
    // those are asked for on the state's page.
    const state = stateByRegion(resolved.regionCode);
    if (state && resolved.stateSeats) {
      await saveStateLocation(session.user.id, state, resolved.stateSeats, source);
      await refreshUserAlignment(session.user.id);
    }
  }
  return NextResponse.json(resolved);
}
