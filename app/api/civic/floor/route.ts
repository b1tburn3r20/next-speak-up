import { NextResponse } from "next/server";
import { getFloorSchedule } from "@/lib/civic/floor";
import { floorOutcome, weekLabel } from "@/lib/civic/floor-logic";

/** The floor schedule as data. Public, like the page it mirrors. */
export async function GET() {
  const now = new Date();
  const items = await getFloorSchedule(now);
  return NextResponse.json({
    items: items.map((item) => ({
      week: weekLabel(item.weekOf, now),
      weekOf: item.weekOf.toISOString().slice(0, 10),
      category: item.category,
      legislationRef: item.legislationRef,
      title: item.title,
      stage: item.stage,
      documentUrl: item.documentUrl,
      slug: item.bill?.slug ?? null,
      outcome: item.bill ? floorOutcome(item.bill.actions, item.weekOf) : null,
    })),
  });
}
