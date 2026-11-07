import { NextResponse } from "next/server";
import { getFloorBoard, getFloorSchedule } from "@/lib/civic/floor";
import { floorOutcome, weekLabel } from "@/lib/civic/floor-logic";

/** The floor schedule as data. Public, like the page it mirrors. */
export async function GET() {
  const now = new Date();
  const [items, board] = await Promise.all([getFloorSchedule(now), getFloorBoard(now)]);
  const brief = (item: (typeof board.senate.waiting)[number]) => ({
    weekOf: item.weekOf.toISOString().slice(0, 10),
    category: item.category,
    legislationRef: item.legislationRef,
    slug: item.bill?.slug ?? null,
  });
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
    nextMeeting: {
      house: board.house.nextMeeting && { when: board.house.nextMeeting.legislationRef, program: board.house.nextMeeting.title },
      senate: board.senate.nextMeeting && { when: board.senate.nextMeeting.legislationRef, program: board.senate.nextMeeting.title },
    },
    senate: {
      thisWeek: board.senate.thisWeek.map(brief),
      nextWeek: board.senate.nextWeek.map(brief),
      later: board.senate.later.map(brief),
      waiting: board.senate.waiting.map(brief),
    },
  });
}
