import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserLocation } from "@/lib/civic/users";
import { listBills } from "@/lib/civic/bills";
import { roleLabel, seatLabel } from "@/lib/civic/labels";
import { bioguideOf, repsForLocation } from "@/lib/civic/people";
import { STATE_NAMES } from "@/lib/constants/state-names";

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
  const [reps, { bills }] = await Promise.all([
    repsForLocation(state, district),
    listBills({ limit: 5 }),
  ]);
  const stateName = (STATE_NAMES as Record<string, string>)[state] ?? state;
  return NextResponse.json({
    reps: reps.map((rep) => {
      const term = rep.terms[0];
      return {
        id: rep.id,
        name: rep.fullName,
        imageUrl: rep.imageUrl,
        bioguide: bioguideOf(rep),
        party: term?.party ?? null,
        role: term ? roleLabel(term.role) : "",
        seat: term ? seatLabel(stateName, term.district?.code, term.chamber.kind) : stateName,
      };
    }),
    suggestedBills: bills.map((bill) => ({
      slug: bill.slug,
      title: bill.title,
      billType: bill.billType,
      number: bill.number,
    })),
  });
}
