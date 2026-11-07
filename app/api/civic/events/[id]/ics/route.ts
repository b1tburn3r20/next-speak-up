import { NextRequest, NextResponse } from "next/server";
import { buildIcs } from "@/lib/civic/state-logic";
import prisma from "@/prisma/client";

/** A calendar file for one meeting. Public, like the page it comes from. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const event = await prisma.civicEvent.findUnique({
    where: { id },
    select: { id: true, title: true, startsAt: true, hasTime: true, location: true, joinUrl: true, sourceUrl: true },
  });
  if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(buildIcs(event, new Date()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting-${event.id}.ics"`,
    },
  });
}
