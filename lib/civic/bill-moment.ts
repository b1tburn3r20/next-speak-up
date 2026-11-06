// What to say about when a bill last moved, so every card and page agree. Pure logic.

import { fullDate } from "@/lib/relative-time";
import { easternToday, mondayOf } from "@/lib/civic/floor-logic";

export type BillMoment = { label: string; date: Date };

const CHAMBER_NAME: Record<string, string> = { LOWER: "the House", UPPER: "the Senate" };

function passedOriginLabel(billType: string): string {
  // House bills start in the House, and Senate bills in the Senate.
  const chamber = billType.startsWith("h") ? "LOWER" : "UPPER";
  return `Passed ${CHAMBER_NAME[chamber]}`;
}

const STATUS_LABELS: Record<string, string> = {
  BECAME_LAW: "Became law",
  SIGNED: "Signed into law",
  VETO_OVERRIDDEN: "Became law over a veto",
  VETOED: "Vetoed",
  TO_EXECUTIVE: "Sent to the President",
  RESOLVING_DIFFERENCES: "Chambers working out differences",
  PASSED_BOTH_CHAMBERS: "Passed Congress",
  AGREED_TO: "Agreed to",
  REPORTED: "Sent to the full chamber",
  IN_COMMITTEE: "Sent to committee",
  FAILED: "Failed",
};

/**
 * The bill's latest milestone. Uses the date of the action that set its status, and falls back to
 * when it was introduced. A bill with no date from the source returns null rather than a guess.
 */
export function billMoment(bill: {
  currentStatus: string;
  billType: string;
  statusDate: Date | null;
  introducedDate: Date | null;
  latestActionDate?: Date | null;
}): BillMoment | null {
  if (bill.currentStatus !== "INTRODUCED" && bill.statusDate) {
    const label =
      bill.currentStatus === "PASSED_ORIGIN_CHAMBER"
        ? passedOriginLabel(bill.billType)
        : (STATUS_LABELS[bill.currentStatus] ?? "Updated");
    return { label, date: bill.statusDate };
  }
  if (bill.introducedDate) return { label: "Introduced", date: bill.introducedDate };
  if (bill.latestActionDate) return { label: "Last action", date: bill.latestActionDate };
  return null;
}

export type FloorMoment = {
  monday: Date;
  text: string;
  /** Replaces the countdown while the week is underway, because "in 2 days" would be made up. */
  fixedText?: string;
  exactDate: string;
  detail: string;
};

const FLOOR_DETAIL =
  "The House lists the bills it may consider each week, but not the day, and a listed bill may not get a vote.";

/**
 * When a House vote might happen. The schedule only names a week, so a coming week counts down to
 * its Monday, and the current week just says "this week".
 */
export function floorMoment(weekOf: Date, now: Date): FloorMoment {
  const monday = mondayOf(weekOf);
  const thisMonday = mondayOf(easternToday(now));
  const exactDate = `Week of ${fullDate(monday)}`;
  if (monday.getTime() > thisMonday.getTime()) {
    return { monday, text: "House vote possible", exactDate, detail: FLOOR_DETAIL };
  }
  if (monday.getTime() === thisMonday.getTime()) {
    return {
      monday,
      text: "House vote possible",
      fixedText: "House vote possible this week",
      exactDate,
      detail: FLOOR_DETAIL,
    };
  }
  return { monday, text: "Listed for a House vote", exactDate, detail: FLOOR_DETAIL };
}
