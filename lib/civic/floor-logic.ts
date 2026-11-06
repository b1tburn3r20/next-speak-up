// Pure logic for the House floor schedule. No database access here, so it's easy to test.

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
