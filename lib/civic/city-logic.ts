// When a city lets people speak, and when its agenda goes up. Pure, so tests can cover it.
import type { CityConfig } from "./states";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date's calendar day where the city is, as the UTC midnight of that day. */
export function localDay(date: Date, timeZone: string): Date {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return new Date(`${day}T00:00:00.000Z`);
}

/** The UTC instant of a local wall-clock time on a local day. Works across daylight saving. */
export function atLocalTime(day: Date, hour: number, minute: number, timeZone: string): Date {
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

/** The section the cities pipeline gives what a meeting's minutes say passed. It isn't an agenda topic. */
export const ADOPTED_SECTION = "Adopted";

/** Topics grouped by where they sit on the agenda, in the agenda's own order. What passed is left out. */
export function groupTopics<T extends { section: string | null; title: string }>(items: T[]): { section: string; items: T[] }[] {
  const groups: { section: string; items: T[] }[] = [];
  for (const item of items) {
    if (item.section === ADOPTED_SECTION) continue;
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

export type OfficialVote = {
  position: string;
  rollCall: { description: string | null; occurredAt: Date | null; totalNay: number };
};

export type OfficialRecord = {
  votes: number;
  /** Votes where they were there: yes, no, or stepping aside for a conflict. */
  present: number;
  attendancePercent: number | null;
  nays: number;
  abstained: number;
  /** Of the votes that weren't unanimous, how often they were on the winning side. */
  splitVotes: number;
  moved: number;
  seconded: number;
  meetings: number;
  meetingsAttended: number;
  firstVote: Date | null;
  lastVote: Date | null;
};

/** Their record from the checked votes. Counts only, nothing judged: a "no" isn't good or bad. */
export function summarizeOfficialRecord(votes: OfficialVote[], lastName: string): OfficialRecord {
  const present = votes.filter((vote) => vote.position !== "NOT_VOTING").length;
  const name = lastName.toLowerCase();
  const byMeeting = new Map<string, boolean>();
  for (const vote of votes) {
    const day = vote.rollCall.occurredAt?.toISOString().slice(0, 10);
    if (!day) continue;
    byMeeting.set(day, (byMeeting.get(day) ?? false) || vote.position !== "NOT_VOTING");
  }
  // Whole names only, so "Moved by Vossberg" isn't counted as Voss's.
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const movedBy = new RegExp(`^moved by ${escaped}\\b`, "i");
  const secondedBy = new RegExp(`seconded by ${escaped}\\b`, "i");
  const moved = votes.filter((vote) => movedBy.test(vote.rollCall.description ?? "")).length;
  const seconded = votes.filter((vote) => secondedBy.test(vote.rollCall.description ?? "")).length;
  const dates = votes.flatMap((vote) => (vote.rollCall.occurredAt ? [vote.rollCall.occurredAt.getTime()] : []));
  // Rounding must never show someone who missed a vote as having a perfect record.
  const raw = votes.length === 0 ? null : Math.round((present / votes.length) * 100);
  return {
    votes: votes.length,
    present,
    attendancePercent: raw === 100 && present < votes.length ? 99 : raw,
    nays: votes.filter((vote) => vote.position === "NAY").length,
    abstained: votes.filter((vote) => vote.position === "PRESENT").length,
    splitVotes: votes.filter((vote) => vote.rollCall.totalNay > 0).length,
    moved,
    seconded,
    meetings: byMeeting.size,
    meetingsAttended: [...byMeeting.values()].filter(Boolean).length,
    firstVote: dates.length ? new Date(Math.min(...dates)) : null,
    lastVote: dates.length ? new Date(Math.max(...dates)) : null,
  };
}

/** What a position means, in plain words. */
export function cityPositionLabel(position: string): string {
  return { YEA: "Yes", NAY: "No", PRESENT: "Stepped aside", NOT_VOTING: "Absent" }[position] ?? position;
}

const WEEKDAYS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const ORDINALS: Record<string, number> = { "1st": 1, first: 1, "2nd": 2, second: 2, "3rd": 3, third: 3, "4th": 4, fourth: 4, "5th": 5, fifth: 5, last: -1 };

export type MeetingSchedule = {
  /** Which of the month's weekdays: 1 for the first, -1 for the last. Empty means every week. */
  weeks: number[];
  weekday: number;
  /** As the city wrote it, like "6:00 PM", when it gave one. */
  time: { hour: number; minute: number } | null;
};

/**
 * A council's regular schedule, as a city or a state's directory states it: "1st/3rd Wed",
 * "2nd & 4th Mondays at 6:00 p.m.", "Every Tuesday 7 PM". Anything less clear gives null, so a guess is
 * never shown as a date.
 */
export function parseMeetingSchedule(text: string | null | undefined): MeetingSchedule | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const days = [...lower.matchAll(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/g)].map((match) => WEEKDAYS[match[1]]);
  if (new Set(days).size !== 1) return null;
  const weeks = [...lower.matchAll(/\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth|last)\b/g)].map((match) => ORDINALS[match[1]]);
  if (weeks.length === 0 && !/\bevery\b|\beach\b|\bweekly\b/.test(lower)) return null;
  const clock = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\b/);
  let time: MeetingSchedule["time"] = null;
  if (clock) {
    const hour = (Number(clock[1]) % 12) + (clock[3] === "p" ? 12 : 0);
    time = { hour, minute: Number(clock[2] ?? 0) };
  }
  return { weeks: [...new Set(weeks)].sort(), weekday: days[0], time };
}

function occursOn(day: Date, schedule: MeetingSchedule): boolean {
  if (day.getUTCDay() !== schedule.weekday) return false;
  if (schedule.weeks.length === 0) return true;
  const nth = Math.floor((day.getUTCDate() - 1) / 7) + 1;
  const isLast = new Date(day.getTime() + 7 * DAY_MS).getUTCMonth() !== day.getUTCMonth();
  return schedule.weeks.includes(nth) || (isLast && schedule.weeks.includes(-1));
}

export type ScheduledMeeting = {
  /** The local day, as the UTC midnight of that day. */
  day: Date;
  /** The start, when the schedule gives a time. */
  startsAt: Date | null;
};

/**
 * The next regular meeting by the city's stated schedule, for a city whose agendas aren't online. It's
 * only what the schedule says: a holiday or a cancellation can move it, and the page says so.
 */
export function nextScheduledMeeting(text: string | null | undefined, timeZone: string, now = new Date()): ScheduledMeeting | null {
  const schedule = parseMeetingSchedule(text);
  if (!schedule) return null;
  const today = localDay(now, timeZone);
  for (let offset = 0; offset < 70; offset += 1) {
    const day = new Date(today.getTime() + offset * DAY_MS);
    if (!occursOn(day, schedule)) continue;
    const startsAt = schedule.time ? atLocalTime(day, schedule.time.hour, schedule.time.minute, timeZone) : null;
    // Today's meeting counts until it starts, or all day when there's no time.
    if (startsAt && startsAt <= now) continue;
    return { day, startsAt };
  }
  return null;
}

/** What we know about one city, for the audit. */
export type CityFacts = {
  mayor: boolean;
  upperDistricts: number;
  lowerDistricts: number;
  phone: string | null;
  address: string | null;
  upcomingMeeting: boolean;
  meetingSchedule: string | null;
  topics: boolean;
  speakUrl: string | null;
  speakInfo: string | null;
};

export const AUDIT_ITEMS = ["mayor", "legislators", "cityHall", "nextMeeting", "topics", "speak"] as const;
export type AuditItem = (typeof AUDIT_ITEMS)[number];
export type CityAudit = Record<AuditItem, boolean>;

export function auditCity(facts: CityFacts): CityAudit {
  return {
    mayor: facts.mayor,
    legislators: facts.upperDistricts > 0 && facts.lowerDistricts > 0,
    cityHall: Boolean(facts.phone || facts.address),
    nextMeeting: facts.upcomingMeeting || parseMeetingSchedule(facts.meetingSchedule) !== null,
    topics: facts.topics,
    // A city with City Hall's phone can always be asked, but that's not a way to sign up, so it's not counted.
    speak: Boolean(facts.speakUrl || facts.speakInfo),
  };
}

/** The items every state's cities must have, and how many of them must have each. */
export const REQUIRED_ITEMS: AuditItem[] = ["mayor", "legislators", "cityHall"];
export const REQUIRED_SHARE = 0.95;

export type CoverageGate = {
  passed: boolean;
  cities: number;
  items: { item: AuditItem; have: number; share: number; required: boolean; passed: boolean }[];
};

/** Whether a state's cities meet the bar. Meetings, topics, and speaking are counted but don't fail it. */
export function coverageGate(audits: CityAudit[], share = REQUIRED_SHARE): CoverageGate {
  const cities = audits.length;
  const items = AUDIT_ITEMS.map((item) => {
    const have = audits.filter((audit) => audit[item]).length;
    const ratio = cities === 0 ? 0 : have / cities;
    const required = REQUIRED_ITEMS.includes(item);
    return { item, have, share: ratio, required, passed: !required || ratio >= share };
  });
  return { passed: cities > 0 && items.every((entry) => entry.passed), cities, items };
}

export type CityAction =
  | { kind: "SPEAK"; href: string }
  | { kind: "REMIND" }
  | { kind: "CALL"; href: string; phone: string }
  | { kind: "AGENDA"; href: string }
  | { kind: "NONE" };

/**
 * The one main thing to do on a city's page, on its first screen. Signing up to speak is the most direct
 * way to be heard, so it wins. With a meeting coming, a reminder keeps it from slipping by. Without one,
 * City Hall's phone is the surest way to find out, and then wherever the city posts its agendas.
 */
export function primaryCityAction(facts: {
  speakUrl: string | null | undefined;
  meetingKnown: boolean;
  phone: string | null | undefined;
  agendaUrl: string | null | undefined;
}): CityAction {
  if (facts.speakUrl) return { kind: "SPEAK", href: facts.speakUrl };
  if (facts.meetingKnown) return { kind: "REMIND" };
  if (facts.phone) return { kind: "CALL", href: telHref(facts.phone), phone: facts.phone };
  if (facts.agendaUrl) return { kind: "AGENDA", href: facts.agendaUrl };
  return { kind: "NONE" };
}

/** A phone number as a link a phone can dial. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
