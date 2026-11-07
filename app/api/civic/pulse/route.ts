import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { countPulse } from "@/lib/civic/engage";
import { repsForLocation } from "@/lib/civic/people";
import { getStateRepIds } from "@/lib/civic/state";
import { getUserLocation } from "@/lib/civic/users";

/** How many of your reps' votes you haven't weighed in on. Signed out, that's just zero. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ count: 0 });
  const location = await getUserLocation(userId);
  if (!location) return NextResponse.json({ count: 0 });
  const reps = await repsForLocation(location.regionCode, location.districtCode);
  const stateRepIds = await getStateRepIds(userId);
  const count = await countPulse(userId, [...reps.map((rep) => rep.id), ...stateRepIds]);
  return NextResponse.json({ count });
}
