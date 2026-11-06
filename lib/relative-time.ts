// Turns a date into words like "2 months ago" or "in 1 week, 3 days". Pure, so it's easy to test.
//
// Government dates are calendar days stored at midnight UTC, so they're compared with today's date
// in Washington. Using a raw time difference would make a bill dated "today" read "5 hours ago",
// and would change the wording depending on where the reader is.

const DAY_MS = 24 * 60 * 60 * 1000;

function easternDay(date: Date): number {
  const text = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return Date.UTC(Number(text.slice(0, 4)), Number(text.slice(5, 7)) - 1, Number(text.slice(8, 10)));
}

function isCalendarDate(date: Date): boolean {
  return date.getTime() % DAY_MS === 0;
}

/**
 * The calendar day of a stored value. Most are plain dates, at midnight UTC. A value with a time,
 * like a House vote at 9pm Eastern, is an exact moment, so it's the day it was in Washington.
 */
function dayOf(date: Date): number {
  return isCalendarDate(date)
    ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    : easternDay(date);
}

/** Whole calendar days from today until a date. Negative means it's in the past. */
export function daysFromToday(date: Date, now: Date): number {
  return Math.round((dayOf(date) - easternDay(now)) / DAY_MS);
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** Whole calendar months between two UTC days, never rounding up past the actual day. */
function monthsBetween(earlier: Date, later: Date): number {
  const months =
    (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 +
    later.getUTCMonth() -
    earlier.getUTCMonth();
  return later.getUTCDate() < earlier.getUTCDate() ? months - 1 : months;
}

/** The biggest unit, and what's left over in the next one down. */
function breakDown(earlier: Date, later: Date): { large: string; small: string | null } {
  const days = Math.round((later.getTime() - earlier.getTime()) / DAY_MS);
  if (days < 7) return { large: plural(days, "day"), small: null };
  const months = monthsBetween(earlier, later);
  if (months < 1) {
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    return { large: plural(weeks, "week"), small: rest ? plural(rest, "day") : null };
  }
  if (months < 12) {
    const anchor = new Date(earlier);
    anchor.setUTCMonth(anchor.getUTCMonth() + months);
    const rest = Math.floor((later.getTime() - anchor.getTime()) / (7 * DAY_MS));
    return { large: plural(months, "month"), small: rest ? plural(rest, "week") : null };
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return { large: plural(years, "year"), small: rest ? plural(rest, "month") : null };
}

/**
 * The past keeps to one unit, because "2 months ago" reads better than "2 months, 1 week ago". The
 * future gets two, because how soon something happens matters: "in 1 week, 3 days".
 */
export function relativeTime(date: Date, now: Date): string {
  const days = daysFromToday(date, now);
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  if (days === 1) return "tomorrow";
  const today = new Date(easternDay(now));
  const day = new Date(dayOf(date));
  if (days < 0) return `${breakDown(day, today).large} ago`;
  const { large, small } = breakDown(today, day);
  return small ? `in ${large}, ${small}` : `in ${large}`;
}

/** "Thursday, November 12, 2026" */
export function fullDate(date: Date): string {
  return new Date(dayOf(date)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "Became law 2 months ago", or "Became law today". */
export function joinLabel(label: string | undefined, relative: string): string {
  return label ? `${label} ${relative}` : relative.charAt(0).toUpperCase() + relative.slice(1);
}
