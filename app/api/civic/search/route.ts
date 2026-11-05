import { NextRequest, NextResponse } from "next/server";
import { listBills } from "@/lib/civic/bills";
import { billLabel, roleLabel } from "@/lib/civic/labels";
import { bioguideOf, listCurrentMembers } from "@/lib/civic/people";

const MAX_MEMBERS = 5;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ bills: [], members: [] });
  }
  const [{ bills }, members] = await Promise.all([
    listBills({ q: query.slice(0, 100), limit: 5 }),
    listCurrentMembers({ q: query.slice(0, 100) }),
  ]);
  return NextResponse.json({
    bills: bills.map((bill) => ({
      href: `/bills/${bill.slug}`,
      label: billLabel(bill.billType, bill.number),
      title: bill.title,
    })),
    members: members.slice(0, MAX_MEMBERS).flatMap((member) => {
      const bioguide = bioguideOf(member);
      const term = member.terms[0];
      return bioguide
        ? [
            {
              href: `/legislators/federal/${bioguide}`,
              label: member.fullName,
              title: term ? `${roleLabel(term.role)}, ${term.regionCode}` : "",
            },
          ]
        : [];
    }),
  });
}
