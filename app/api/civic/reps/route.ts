import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCityOfficials } from "@/lib/civic/city";
import { getStateLocation, getStateSeats } from "@/lib/civic/state";
import { chamberName, stateByRegion } from "@/lib/civic/states";
import { getUserLocation } from "@/lib/civic/users";
import { roleLabel, seatLabel } from "@/lib/civic/labels";
import { memberKeyOf, repsForLocation } from "@/lib/civic/people";
import { STATE_NAMES } from "@/lib/constants/state-names";
import { stateRoutes } from "@/lib/routes";

export async function GET(request: NextRequest) {
  let state = request.nextUrl.searchParams.get("state")?.toUpperCase() ?? "";
  let district = request.nextUrl.searchParams.get("district");
  // With no location given, a signed-in user gets their own saved location.
  if (!state) {
    const session = await getServerSession(authOptions);
    const saved = session?.user?.id ? await getUserLocation(session.user.id) : null;
    state = saved?.regionCode ?? "";
    district = saved?.districtCode ?? null;
  }
  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: "Choose a state." }, { status: 400 });
  }
  const reps = await repsForLocation(state, district);
  const stateName = (STATE_NAMES as Record<string, string>)[state] ?? state;
  const session = await getServerSession(authOptions);
  const covered = stateByRegion(state);
  const location = covered && session?.user?.id ? await getStateLocation(session.user.id, covered) : null;
  const seats = location ? await getStateSeats(location) : [];
  const city = covered && location?.city ? location.city : null;
  const mayor = city ? (await getCityOfficials(city)).find((official) => official.terms[0]?.role === "MAYOR") : undefined;
  return NextResponse.json({
    stateName: covered?.name ?? null,
    // The city a lookup placed them in, if it's in a state we cover.
    city:
      covered && city
        ? { key: city.key, name: city.name, href: stateRoutes(covered.key).city(city.key), mayor: mayor ? { name: mayor.fullName, imageUrl: mayor.imageUrl } : null }
        : null,
    stateReps: seats.flatMap((seat) => {
      const term = seat.member?.terms[0];
      return seat.member
        ? [
            {
              id: seat.member.id,
              name: seat.member.fullName,
              imageUrl: seat.member.imageUrl,
              bioguide: memberKeyOf(seat.member),
              party: term?.party ?? null,
              role: term ? roleLabel(term.role) : "",
              seat: `${chamberName(covered!, seat.chamber)}, District ${seat.code}`,
            },
          ]
        : [];
    }),
    reps: reps.map((rep) => {
      const term = rep.terms[0];
      return {
        id: rep.id,
        name: rep.fullName,
        imageUrl: rep.imageUrl,
        bioguide: memberKeyOf(rep),
        party: term?.party ?? null,
        role: term ? roleLabel(term.role) : "",
        seat: term ? seatLabel(stateName, term.district?.code, term.chamber.kind) : stateName,
      };
    }),
  });
}
