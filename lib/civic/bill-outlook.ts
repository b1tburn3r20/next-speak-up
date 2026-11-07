// What a bill's status means for the person who just voted on it. No database access here.
import { diedWithSession, governmentOfSlug } from "./government";
import type { BillStatusValue } from "./labels";

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Congress hasn't finished with these, so they're the bills where a voice can still count. */
export const OPEN_STATUSES = [
  "INTRODUCED",
  "IN_COMMITTEE",
  "REPORTED",
  "PASSED_ORIGIN_CHAMBER",
  "PASSED_BOTH_CHAMBERS",
  "RESOLVING_DIFFERENCES",
  "TO_EXECUTIVE",
] as const satisfies readonly BillStatusValue[];

export const DECIDED_STATUSES = [
  "AGREED_TO",
  "SIGNED",
  "VETOED",
  "VETO_OVERRIDDEN",
  "BECAME_LAW",
  "FAILED",
] as const satisfies readonly BillStatusValue[];

export type BillOutlook = {
  kind: "OPEN" | "DECIDED";
  title: string;
  body: string;
  /** Whether telling a member of Congress could still change anything. */
  canInfluence: boolean;
};

const STILL_COUNTS = "Your vote still counts toward whether your reps represent you.";

export function billOutlook(
  status: string,
  context: { slug?: string; endDate?: Date | null } = {},
): BillOutlook {
  const government = governmentOfSlug(context.slug ?? "us");
  if (diedWithSession(status, context.endDate)) {
    return {
      kind: "DECIDED",
      title: "This didn't finish before the session ended",
      body: `It would have to be filed again to move. ${STILL_COUNTS}`,
      canInfluence: false,
    };
  }
  switch (status as BillStatusValue) {
    case "BECAME_LAW":
    case "SIGNED":
    case "VETO_OVERRIDDEN":
      return { kind: "DECIDED", title: "This is already law", body: STILL_COUNTS, canInfluence: false };
    case "AGREED_TO":
      return { kind: "DECIDED", title: "This resolution was agreed to", body: STILL_COUNTS, canInfluence: false };
    case "FAILED":
      return { kind: "DECIDED", title: "This one didn't pass", body: STILL_COUNTS, canInfluence: false };
    case "VETOED":
      return {
        kind: "DECIDED",
        title: `The ${government.executive} vetoed this`,
        body: `${capitalized(government.legislature)} could try to override it. ${STILL_COUNTS}`,
        canInfluence: true,
      };
    case "TO_EXECUTIVE":
      return {
        kind: "OPEN",
        title: `It's on the ${government.executive}'s desk`,
        body: `${capitalized(government.legislature)} passed it, and the ${government.executive} decides next. ${STILL_COUNTS}`,
        canInfluence: false,
      };
    default:
      return {
        kind: "OPEN",
        title: "Still undecided",
        body: `${capitalized(government.legislature)} hasn't finished with this one, so your voice can still count.`,
        canInfluence: true,
      };
  }
}
