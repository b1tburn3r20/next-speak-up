// The words and links that differ between governments. Pure, so pages and tests can share it.
import { BILL_STATUS_LABELS, type BillStatusValue } from "./labels";

export type Government = {
  /** How bill slugs start: "us", "ia". */
  key: string;
  code: string;
  name: string;
  /** Used mid-sentence: "Congress hasn't finished with this one." */
  legislature: string;
  executive: string;
  billsHref: string;
  legislatorsHref: string;
  stages: string[];
  sourceName: string;
  lawLabel: (lawNumber: string) => string;
};

const FEDERAL: Government = {
  key: "us",
  code: "US",
  name: "Congress",
  legislature: "Congress",
  executive: "President",
  billsHref: "/federal/bills",
  legislatorsHref: "/federal/legislators",
  stages: ["Introduced", "Committee", "Floor", "Both chambers", "President", "Law"],
  sourceName: "Congress.gov",
  lawLabel: (lawNumber) => `Public Law ${lawNumber}`,
};

const IOWA: Government = {
  key: "ia",
  code: "US-IA",
  name: "Iowa",
  legislature: "the Iowa Legislature",
  executive: "Governor",
  billsHref: "/state/ia/bills",
  legislatorsHref: "/state/ia/legislators",
  stages: ["Introduced", "Committee", "Floor", "Both chambers", "Governor", "Law"],
  sourceName: "the Iowa Legislature",
  lawLabel: (lawNumber) => lawNumber,
};

const GOVERNMENTS: Record<string, Government> = { us: FEDERAL, ia: IOWA };

export function governmentOfSlug(slug: string): Government {
  return GOVERNMENTS[slug.split("-", 1)[0]] ?? FEDERAL;
}

/** Whether the bill's session is over, which is what stops an unfinished bill from moving. */
export function sessionHasEnded(endDate: Date | null | undefined, now = new Date()): boolean {
  return Boolean(endDate && endDate.getTime() <= now.getTime());
}

const STILL_MOVING: readonly string[] = [
  "INTRODUCED",
  "IN_COMMITTEE",
  "REPORTED",
  "PASSED_ORIGIN_CHAMBER",
  "PASSED_BOTH_CHAMBERS",
  "RESOLVING_DIFFERENCES",
];

/** True when a bill never finished, and its session is over, so it can't go any further. */
export function diedWithSession(status: string, endDate: Date | null | undefined, now = new Date()): boolean {
  return sessionHasEnded(endDate, now) && STILL_MOVING.includes(status);
}

/** What to call a bill's status, in that government's words. */
export function billStatusText(status: string, slug?: string, endDate?: Date | null): string {
  if (diedWithSession(status, endDate)) return "Session ended";
  if (status === "TO_EXECUTIVE" && slug) return `Sent to the ${governmentOfSlug(slug).executive}`;
  return BILL_STATUS_LABELS[status as BillStatusValue] ?? status;
}

/** The next General Assembly's first day. Iowa's own list gives the 91st's last day as January 10. */
export const IOWA_NEXT_SESSION = new Date("2027-01-11T06:00:00.000Z");

export function iowaSessionHasStarted(now = new Date()): boolean {
  return now.getTime() >= IOWA_NEXT_SESSION.getTime();
}

const IOWA_ACTIONS: [RegExp, string][] = [
  [/^signed by governor/i, "It's now the law."],
  [/^vetoed by governor/i, "The Governor vetoed it."],
  [/\bitem veto/i, "The Governor signed it, but vetoed some parts."],
  [/sent to governor/i, "The Legislature passed it, and sent it to the Governor."],
  [/\bpassed house, yeas/i, "The House passed it."],
  [/\bpassed senate, yeas/i, "The Senate passed it."],
  [/^introduced, referred to /i, "It was introduced, and sent to a committee."],
  [/^read first time, referred to /i, "It arrived from the other chamber, and went to a committee."],
  [/^subcommittee recommends/i, "A small group of committee members recommended it."],
  [/^committee report, recommending/i, "The committee recommended it."],
  [/^committee vote:/i, "The committee voted."],
  [/^introduced, placed on calendar/i, "It's ready for the full chamber to debate."],
  [/^fiscal note/i, "Nonpartisan staff estimated what it would cost."],
];

/** What an Iowa action means. Only for wording we're sure of. Anything else shows as it's written. */
export function explainIowaAction(text: string): string | null {
  return IOWA_ACTIONS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}
