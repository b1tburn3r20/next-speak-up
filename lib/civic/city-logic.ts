// When a city lets people speak, and when its agenda goes up. Pure, so tests can cover it.
import type { CityConfig } from "./states";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date's calendar day where the city is, as the UTC midnight of that day. */
function localDay(date: Date, timeZone: string): Date {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return new Date(`${day}T00:00:00.000Z`);
}

/** The UTC instant of a local wall-clock time on a local day. Works across daylight saving. */
function atLocalTime(day: Date, hour: number, minute: number, timeZone: string): Date {
  const guess = new Date(day.getTime() + (hour * 60 + minute) * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess.getTime() - (shown - guess.getTime()));
}

export type SpeakWindow = {
  opensAt: Date;
  closesAt: Date;
  status: "NOT_YET" | "OPEN" | "CLOSED";
};

/**
 * When someone can ask to speak at a regular meeting, by the city's own rule. For Des Moines, that's from
 * ten days before until 5 p.m. the day before. The city decides who speaks, so this only says when to ask.
 */
export function speakWindow(meetingStartsAt: Date, city: Pick<CityConfig, "requestToSpeak">, timeZone: string, now = new Date()): SpeakWindow {
  const day = localDay(meetingStartsAt, timeZone);
  const rule = city.requestToSpeak;
  const opensAt = atLocalTime(new Date(day.getTime() - rule.opensDaysBefore * DAY_MS), 0, 0, timeZone);
  const closesAt = atLocalTime(new Date(day.getTime() - DAY_MS), rule.closesDayBeforeAt.hour, rule.closesDayBeforeAt.minute, timeZone);
  const status = now < opensAt ? "NOT_YET" : now < closesAt ? "OPEN" : "CLOSED";
  return { opensAt, closesAt, status };
}

/** When the agenda should be up, by the city's own rule. Before then, there's nothing to read yet. */
export function agendaPostsAt(meetingStartsAt: Date, city: Pick<CityConfig, "agendaPosted">, timeZone: string): Date {
  const day = localDay(meetingStartsAt, timeZone);
  const rule = city.agendaPosted;
  return atLocalTime(new Date(day.getTime() - rule.daysBefore * DAY_MS), rule.hour, rule.minute, timeZone);
}

/** Topics grouped by where they sit on the agenda, in the agenda's own order. */
export function groupTopics<T extends { section: string | null; title: string }>(items: T[]): { section: string; items: T[] }[] {
  const groups: { section: string; items: T[] }[] = [];
  for (const item of items) {
    const section = item.section ?? "On the agenda";
    const group = groups.find((entry) => entry.section === section);
    if (group) group.items.push(item);
    else groups.push({ section, items: [item] });
  }
  return groups;
}

/** "Ward 2", "At-large", or "Mayor", for a seat. */
export function seatName(role: string, districtCode: string | null | undefined): string {
  if (role === "MAYOR") return "Mayor";
  if (!districtCode || districtCode === "AL") return "At-large";
  return `Ward ${districtCode}`;
}

/** Whether a ward number is one this city has. */
export function validWard(city: Pick<CityConfig, "council">, value: string | null | undefined): string | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= city.council.wards ? String(number) : null;
}
