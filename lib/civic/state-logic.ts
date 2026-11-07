// States and local government. Pure, so tests can cover it. No database access here.

export type EventKind = "COMMITTEE" | "SUBCOMMITTEE" | "HEARING" | "COUNCIL_MEETING" | "ELECTION" | "DEADLINE";

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  COMMITTEE: "Committee meeting",
  SUBCOMMITTEE: "Subcommittee meeting",
  HEARING: "Public hearing",
  COUNCIL_MEETING: "City Council",
  ELECTION: "Election",
  DEADLINE: "Deadline",
};

/** How a person can take part, in plain words. Says "usually", because each meeting sets its own rules. */
export function howToTakePart(kind: EventKind): string {
  switch (kind) {
    case "SUBCOMMITTEE":
      return "This is often the best place to be heard. Subcommittee meetings are open to the public, and they usually take comments from people who attend.";
    case "COMMITTEE":
      return "Open to the public to watch. Committee members vote here on whether a bill moves forward.";
    case "HEARING":
      return "Public hearings exist to hear from people like you. Check the agenda for how to sign up to speak.";
    case "COUNCIL_MEETING":
      return "Council meetings are open to the public. Check the agenda for what's being decided and when you can speak.";
    default:
      return "Check the source for details.";
  }
}

const REPORT_WINDOW_DAYS = 14;

/** You can say you went once it's begun, for two weeks. Not before, and not for something canceled. */
export function canReportAttendance(event: { startsAt: Date; status: string }, now: Date): boolean {
  if (event.status === "CANCELED") return false;
  const elapsed = now.getTime() - event.startsAt.getTime();
  return elapsed >= 0 && elapsed <= REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** A calendar file for one event. A meeting with only a date becomes an all-day event. */
export function buildIcs(
  event: {
    id: number;
    title: string;
    startsAt: Date;
    hasTime: boolean;
    location: string | null;
    joinUrl: string | null;
    sourceUrl: string | null;
  },
  now: Date,
): string {
  const day = event.startsAt.toISOString().slice(0, 10).replace(/-/g, "");
  const nextDay = new Date(event.startsAt.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
  const oneHourLater = new Date(event.startsAt.getTime() + 60 * 60 * 1000);
  const url = event.joinUrl ?? event.sourceUrl;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coolbills//Civic Events//EN",
    "BEGIN:VEVENT",
    `UID:civic-event-${event.id}@coolbills`,
    `DTSTAMP:${icsStamp(now)}`,
    ...(event.hasTime
      ? [`DTSTART:${icsStamp(event.startsAt)}`, `DTEND:${icsStamp(oneHourLater)}`]
      : [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${nextDay}`]),
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(url ? [`URL:${icsText(url)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** What to say about a seat: who holds it, or that it's empty and who held it last. */
export type Seat =
  | { status: "FILLED"; personId: number; name: string; party: string | null; phone: string | null; websiteUrl: string | null; imageUrl: string | null }
  | { status: "VACANT"; lastHolder: string | null; endYear: number | null };
