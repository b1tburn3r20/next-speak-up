import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import {
  districtFromAddress,
  districtFromCoordinates,
  isValidCoordinate,
} from "@/lib/civic/location";
import { saveUserLocation, type LocationSource } from "@/lib/civic/users";

// Coordinates and addresses are used for the lookup and then discarded. Only the state and
// district are saved, and that's only for signed-in users.
const lookupSchema = z.union([
  z.object({ lat: z.number(), lng: z.number() }),
  z.object({ address: z.string().trim().min(5).max(200) }),
  z.object({
    regionCode: z.string().length(2).toUpperCase(),
    districtCode: z.string().min(1).max(4),
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

  let resolved: { regionCode: string; districtCode: string } | null;
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
      resolved = { regionCode: input.regionCode, districtCode: input.districtCode };
      source = "MANUAL";
    } else {
      return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    }
  } catch (error) {
    console.error("Location lookup failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "The location service isn't responding. Choose your state and district instead." },
      { status: 502 },
    );
  }

  if (!resolved) {
    return NextResponse.json(
      { error: "We couldn't find a district there. Choose your state and district instead." },
      { status: 404 },
    );
  }

  if (session?.user?.id) {
    const saved = await saveUserLocation(
      session.user.id,
      resolved.regionCode,
      resolved.districtCode,
      source,
    );
    if (!saved) {
      return NextResponse.json({ error: "That district doesn't exist." }, { status: 400 });
    }
  }
  return NextResponse.json(resolved);
}
