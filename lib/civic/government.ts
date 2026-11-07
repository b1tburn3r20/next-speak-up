// The words and links that differ between governments. Pure, so pages and tests can share it.
import { stateRoutes } from "@/lib/routes";
import { BILL_STATUS_LABELS, type BillStatusValue } from "./labels";
import { stateOfSlug, type StateConfig } from "./states";

export type Government = {
  /** How bill slugs start: "us", or a state's key. */
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

/** A state's government, built from its entry in lib/civic/states.ts. */
function stateGovernment(state: StateConfig): Government {
  const routes = stateRoutes(state.key);
  return {
    key: state.key,
    code: state.jurisdiction,
    name: state.name,
    legislature: state.legislature,
    executive: "Governor",
    billsHref: routes.bills,
    legislatorsHref: routes.legislators,
    stages: ["Introduced", "Committee", "Floor", "Both chambers", "Governor", "Law"],
    sourceName: state.sourceName,
    lawLabel: (lawNumber) => lawNumber,
  };
}

export function governmentOfSlug(slug: string): Government {
  const state = stateOfSlug(slug);
  return state ? stateGovernment(state) : FEDERAL;
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


/** Each state's own wording. Only for steps we're sure of. Anything else shows as it's written. */
const STATE_ACTIONS: Record<string, [RegExp, string][]> = {
  ia: [
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
  ],
};

export function explainStateAction(state: StateConfig, text: string): string | null {
  return STATE_ACTIONS[state.key]?.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}
