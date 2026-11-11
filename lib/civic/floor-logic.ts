// Pure logic for the House and Senate floor schedules. No database access here, so it's easy to test.

const DAY_MS = 24 * 60 * 60 * 1000;

export type WeekPosition = "EARLIER" | "LAST" | "THIS" | "NEXT" | "LATER";
export type FloorOutcome = { kind: "PASSED" | "FAILED"; date: Date };

export const FLOOR_CATEGORY_LABELS: Record<string, { label: string; hint: string }> = {
  SUSPENSION: {
    label: "Fast track",
    hint: "Considered under suspension of the rules: limited debate, and needs two-thirds to pass.",
  },
  RULE: {
    label: "Under a rule",
    hint: "The House sets the terms of debate first. Usually needs a simple majority to pass.",
  },
  OTHER: { label: "May be considered", hint: "Listed for possible consideration this week." },
  SCHEDULED: {
    label: "Senate order names a date",
    hint: "The Senate agreed to take this up on a set date. Those plans can still change.",
  },
  PENDING: {
    label: "No date yet",
    hint: "The Senate has an agreement about this, but it hasn't set a date.",
  },
};

/** Today's date in Washington, because that's what the House's weeks follow. */
export function easternToday(now: Date): Date {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${day}T00:00:00.000Z`);
}

/** The Monday of a week, at midnight UTC, which is how the database returns dates. */
export function mondayOf(date: Date): Date {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      daysSinceMonday * DAY_MS,
  );
}

export function weekPosition(weekOf: Date, now: Date): WeekPosition {
  const thisWeek = mondayOf(easternToday(now)).getTime();
  const weeksAway = Math.round((mondayOf(weekOf).getTime() - thisWeek) / (7 * DAY_MS));
  if (weeksAway === 0) return "THIS";
  if (weeksAway === 1) return "NEXT";
  if (weeksAway === -1) return "LAST";
  return weeksAway < 0 ? "EARLIER" : "LATER";
}

function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function weekLabel(weekOf: Date, now: Date): string {
  const dates = `week of ${shortDate(weekOf)}`;
  switch (weekPosition(weekOf, now)) {
    case "THIS":
      return `This week (${dates})`;
    case "NEXT":
      return `Next week (${dates})`;
    case "LAST":
      return `Last week (${dates})`;
    default:
      return `The ${dates}`;
  }
}

/**
 * Whether the House has acted on a bill since it was scheduled. Library of Congress codes:
 * 8000 passed the House, 9000 failed in the House. Older actions don't count, because a bill
 * can come back to the floor after an earlier vote.
 */
export function floorOutcome(
  actions: { actionCode: string | null; actionDate: Date }[],
  weekOf: Date,
): FloorOutcome | null {
  const relevant = actions
    .filter((action) => action.actionDate.getTime() >= weekOf.getTime())
    .sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime());
  for (const action of relevant) {
    if (action.actionCode === "8000") return { kind: "PASSED", date: action.actionDate };
    if (action.actionCode === "9000") return { kind: "FAILED", date: action.actionDate };
  }
  return null;
}

export type FloorWeekGroup<T> = {
  weekOf: Date;
  position: WeekPosition;
  label: string;
  items: T[];
};

const POSITION_ORDER: Record<WeekPosition, number> = {
  THIS: 0,
  NEXT: 1,
  LATER: 2,
  LAST: 3,
  EARLIER: 4,
};

/** Groups items into weeks, with what's coming up first and past weeks after it. */
export function groupFloorWeeks<T extends { weekOf: Date }>(
  items: T[],
  now: Date,
): FloorWeekGroup<T>[] {
  const weeks = new Map<number, T[]>();
  for (const item of items) {
    const key = item.weekOf.getTime();
    weeks.set(key, [...(weeks.get(key) ?? []), item]);
  }
  return [...weeks.entries()]
    .map(([key, weekItems]) => {
      const weekOf = new Date(key);
      return {
        weekOf,
        position: weekPosition(weekOf, now),
        label: weekLabel(weekOf, now),
        items: weekItems,
      };
    })
    .sort(
      (a, b) =>
        POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
        a.weekOf.getTime() - b.weekOf.getTime(),
    );
}

/** A chamber's next meeting. It's a notice about the meeting, so it's not an item to vote on. */
export const NEXT_MEETING = "NEXT_MEETING";
/** On the Senate's calendar with no date. */
export const PENDING = "PENDING";

export type ChamberBoard<T> = {
  thisMonday: Date;
  nextMeeting: T | null;
  thisWeek: T[];
  nextWeek: T[];
  later: T[];
  waiting: T[];
};

/**
 * One chamber's rows, sorted into what the dashboard shows. Each new Senate Calendar repeats its
 * undated items, so only the newest calendar's list counts. That also drops anything it's since
 * removed, and anything that's now been given a date.
 */
export function buildChamberBoard<T extends { weekOf: Date; category: string; legislationRef: string }>(
  rows: T[],
  now: Date,
): ChamberBoard<T> {
  const thisMonday = mondayOf(easternToday(now));
  const nextMonday = thisMonday.getTime() + 7 * DAY_MS;
  const dated = rows.filter((row) => row.category !== NEXT_MEETING && row.category !== PENDING);
  const upcoming = dated.filter((row) => row.weekOf.getTime() >= thisMonday.getTime());

  const meetings = rows
    .filter((row) => row.category === NEXT_MEETING && row.weekOf.getTime() >= thisMonday.getTime())
    .sort((a, b) => b.weekOf.getTime() - a.weekOf.getTime());

  const pending = rows.filter((row) => row.category === PENDING);
  const newest = Math.max(0, ...pending.map((row) => row.weekOf.getTime()));
  const scheduledRefs = new Set(upcoming.map((row) => row.legislationRef));
  const waiting = pending.filter(
    (row) => row.weekOf.getTime() === newest && !scheduledRefs.has(row.legislationRef),
  );

  return {
    thisMonday,
    nextMeeting: meetings[0] ?? null,
    thisWeek: upcoming.filter((row) => row.weekOf.getTime() === thisMonday.getTime()),
    nextWeek: upcoming.filter((row) => row.weekOf.getTime() === nextMonday),
    later: upcoming.filter((row) => row.weekOf.getTime() > nextMonday),
    waiting,
  };
}

export type FloorSplit<T> = {
  /** Bills you've already supported or opposed. */
  voted: T[];
  /** Bills Congress hasn't voted on yet, and you haven't either: the ones to beat it to. */
  waiting: T[];
  /** Bills Congress already voted on, which you haven't. How it went stays hidden until you vote. */
  missed: T[];
};

/**
 * Splits the schedule three ways, for Upcoming votes. A bill listed more than once (in two weeks) counts
 * once, at its newest listing. Items without a bill, like a meeting notice, are left out.
 */
export function splitFloorItems<T extends { weekOf: Date; bill: { id: number; actions: { actionCode: string | null; actionDate: Date }[] } | null }>(
  items: T[],
  positionOf: (billId: number) => string | null | undefined,
): FloorSplit<T> {
  const newest = new Map<number, T>();
  for (const item of items) {
    if (!item.bill) continue;
    const held = newest.get(item.bill.id);
    if (!held || held.weekOf.getTime() < item.weekOf.getTime()) newest.set(item.bill.id, item);
  }
  const split: FloorSplit<T> = { voted: [], waiting: [], missed: [] };
  for (const item of [...newest.values()].sort((a, b) => a.weekOf.getTime() - b.weekOf.getTime())) {
    const bill = item.bill as NonNullable<T["bill"]>;
    const position = positionOf(bill.id);
    if (position === "YEA" || position === "NAY") split.voted.push(item);
    else if (floorOutcome(bill.actions, item.weekOf)) split.missed.push(item);
    else split.waiting.push(item);
  }
  return split;
}
