import { NextRequest, NextResponse } from "next/server";
import { listBills } from "@/lib/civic/bills";
import { roleLabel, seatLabel } from "@/lib/civic/labels";
import { bioguideOf, repsForLocation } from "@/lib/civic/people";
import { STATE_NAMES } from "@/lib/constants/state-names";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state")?.toUpperCase() ?? "";
  const district = request.nextUrl.searchParams.get("district");
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
