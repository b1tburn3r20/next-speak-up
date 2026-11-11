// What to notify people about, and when, and what it says. Pure, so tests can cover every case. The
// sender in dispatch.ts does the reading and sending.
import { atLocalTime, localDay } from "@/lib/civic/city-logic";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Message = { title: string; body: string; url: string };

// ---------------------------------------------------------------------------------------------------
// City council meetings
// ---------------------------------------------------------------------------------------------------

export type ReminderSlot = "7d" | "2d" | "1d" | "day";

/** How long before a meeting each reminder goes out, and at what local hour. */
export const MEETING_REMINDERS: { slot: ReminderSlot; daysBefore: number; hour: number }[] = [
  { slot: "7d", daysBefore: 7, hour: 9 },
  { slot: "2d", daysBefore: 2, hour: 9 },
  { slot: "1d", daysBefore: 1, hour: 9 },
  { slot: "day", daysBefore: 0, hour: 8 },
];

/** A meeting someone could be reminded about: a posted one, or the next by the council's schedule. */
export type UpcomingMeeting = {
  /** "event:123", or "sched:1902305:2026-11-18" for one from the schedule. */
  ref: string;
  /** The local day, as the UTC midnight of that day. */
  day: Date;
  /** Null when only the day is known. */
  startsAt: Date | null;
  /** From the council's regular schedule, not a posted agenda. */
  fromSchedule: boolean;
};

/** When a reminder goes out. The day-of one comes earlier for an early meeting, but never before 6 AM. */
export function reminderSendAt(meeting: UpcomingMeeting, slot: ReminderSlot, timeZone: string): Date {
  const rule = MEETING_REMINDERS.find((entry) => entry.slot === slot) ?? MEETING_REMINDERS[0];
  const day = new Date(meeting.day.getTime() - rule.daysBefore * DAY_MS);
  const at = atLocalTime(day, rule.hour, 0, timeZone);
  if (slot !== "day" || !meeting.startsAt) return at;
  const twoHoursBefore = new Date(meeting.startsAt.getTime() - 2 * 60 * 60 * 1000);
  const earliest = atLocalTime(day, 6, 0, timeZone);
  return twoHoursBefore < at ? (twoHoursBefore < earliest ? earliest : twoHoursBefore) : at;
}

/**
 * The reminders due for a meeting right now. One whose time has come is still sent later the same local
 * day, so a sender that was down for an hour catches up, but never on a later day: a reminder that says
 * "next week" on the day before would be wrong. Nothing is sent once the meeting has started.
 */
export function dueReminders(meeting: UpcomingMeeting, now: Date, timeZone: string): ReminderSlot[] {
  const today = localDay(now, timeZone).getTime();
  if (meeting.startsAt ? now >= meeting.startsAt : today > meeting.day.getTime()) return [];
  return MEETING_REMINDERS.filter(({ slot }) => {
    const sendAt = reminderSendAt(meeting, slot, timeZone);
    return sendAt <= now && localDay(sendAt, timeZone).getTime() === today;
  }).map(({ slot }) => slot);
}

const WHEN_WORDS: Record<ReminderSlot, (weekday: string) => string> = {
  "7d": (weekday) => `next ${weekday}`,
  "2d": (weekday) => weekday,
  "1d": () => "tomorrow",
  day: () => "today",
};

export function meetingMessage(
  input: {
    cityName: string;
    meeting: UpcomingMeeting;
    slot: ReminderSlot;
    title: string | null;
    url: string;
    speakUrl?: string | null;
    phone?: string | null;
  },
  timeZone: string,
): Message {
  const { cityName, meeting, slot } = input;
  const weekday = meeting.day.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const date = meeting.day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const time = meeting.startsAt ? meeting.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone }) : null;
  const meets = meeting.fromSchedule ? "usually meets" : "meets";
  const title = `${cityName} City Council ${meets} ${WHEN_WORDS[slot](weekday)}${slot === "day" && time ? ` at ${time}` : ""}`;
  const parts = [slot === "day" ? null : `${date}${time ? ` at ${time}` : ""}.`];
  if (meeting.fromSchedule) {
    parts.push(input.phone ? `That's its regular schedule. Call City Hall at ${input.phone} to be sure.` : "That's its regular schedule, so check with City Hall to be sure.");
  } else if (input.title) {
    parts.push(input.title.endsWith(".") ? input.title : `${input.title}.`);
  }
  if ((slot === "1d" || slot === "day") && !meeting.fromSchedule) {
    parts.push(input.speakUrl ? "Want to speak? Tap for how to sign up." : "Tap to see what's on the agenda.");
  }
  return { title, body: parts.filter(Boolean).join(" "), url: input.url };
}

// ---------------------------------------------------------------------------------------------------
// Bills on the floor this week
// ---------------------------------------------------------------------------------------------------

/** The week's key, its Monday as YYYY-MM-DD, when the weekly digest is due: Mondays from 9 AM local. */
export function floorWeekDue(now: Date, timeZone: string): string | null {
  const today = localDay(now, timeZone);
  if (today.getUTCDay() !== 1) return null;
  if (now < atLocalTime(today, 9, 0, timeZone)) return null;
  return today.toISOString().slice(0, 10);
}

export type FloorBill = { billId: number; slug: string; label: string; title: string; policyArea: string | null; chamber: ChamberKind };

/** A unicameral legislature, like Nebraska's, works like a lower chamber: one member per district. */
export type ChamberKind = "LOWER" | "UPPER" | "UNICAMERAL";

/** The bills on this week's schedule in someone's topics, one of each, House first. */
export function floorBillsFor(bills: FloorBill[], topics: Set<string>): FloorBill[] {
  const seen = new Set<number>();
  return bills
    .filter((bill) => bill.policyArea && topics.has(bill.policyArea))
    .sort((a, b) => (a.chamber === b.chamber ? 0 : a.chamber === "LOWER" ? -1 : 1))
    .filter((bill) => (seen.has(bill.billId) ? false : (seen.add(bill.billId), true)));
}

/** One notification for the week. "May come up", because a scheduled bill isn't a promised vote. */
export function floorWeekMessage(bills: FloorBill[], url: string): Message | null {
  if (bills.length === 0) return null;
  const areas = [...new Set(bills.map((bill) => bill.policyArea as string))];
  const topicWords = areas.length === 1 ? areas[0] : areas.length === 2 ? `${areas[0]} and ${areas[1]}` : "your topics";
  const title =
    bills.length === 1 ? `A ${topicWords} bill may come up for a vote this week` : `${bills.length} ${topicWords} bills may come up for a vote this week`;
  const named = bills.slice(0, 2).map((bill) => `${bill.label}: ${shorten(bill.title, 70)}`);
  const more = bills.length > 2 ? ` And ${bills.length - 2} more.` : "";
  return { title, body: `${named.join(". ")}.${more} Vote first, and we'll tell you how it turns out.`, url };
}

// ---------------------------------------------------------------------------------------------------
// How a vote turned out
// ---------------------------------------------------------------------------------------------------

export type Position = "YEA" | "NAY" | "PRESENT" | "NOT_VOTING";

/** A legislator's vote, with what makes them someone's: their district, or their state for a U.S. senator. */
export type CastVote = { personId: number; name: string; position: Position; districtId: number | null; regionCode: string };

/** Where someone lives, for the government that held the vote. */
export type VoterPlace = { regionCode: string; districtId: number | null; upperDistrictId: number | null };

/**
 * The legislators who represent someone in the chamber that voted. A U.S. senator represents the whole
 * state. Everyone else, House members and state senators, represents a district.
 */
export function theirLegislators(votes: CastVote[], place: VoterPlace | null, chamber: ChamberKind, federal: boolean): CastVote[] {
  if (!place) return [];
  if (chamber === "UPPER" && federal) return votes.filter((vote) => vote.regionCode === place.regionCode);
  const district = chamber === "UPPER" ? place.upperDistrictId : place.districtId;
  return district === null ? [] : votes.filter((vote) => vote.districtId === district);
}

const POSITION_WORDS: Record<Position, string> = { YEA: "Support", NAY: "Oppose", PRESENT: "Present", NOT_VOTING: "Didn't vote" };

/** "passed", "failed", or plain "voted on", from the source's result. */
export function outcomeWord(result: string | null | undefined): "passed" | "rejected" | "voted on" {
  const text = (result ?? "").toLowerCase();
  if (/fail|reject|not (agreed|passed)|defeat/.test(text)) return "rejected";
  if (/pass|agreed|adopt|confirm/.test(text)) return "passed";
  return "voted on";
}

/**
 * "The House passed H.R. 123, 230 to 190. Your rep Zach Nunn voted Support, the same as you." Naming
 * the legislator's vote is fine here: someone gets this only for a bill they followed, voted on, or asked
 * to hear about.
 */
export function voteResultMessage(input: {
  chamberName: string;
  label: string;
  result: string | null;
  yea: number;
  nay: number;
  legislators: CastVote[];
  /** Theirs, if they voted. */
  mine: Position | null;
  url: string;
}): Message {
  const outcome = outcomeWord(input.result);
  const title = `${input.chamberName} ${outcome} ${input.label}`;
  const parts = [`${input.yea} to ${input.nay}.`];
  if (input.legislators.length === 1) {
    const [rep] = input.legislators;
    parts.push(`${rep.name} voted ${POSITION_WORDS[rep.position]}${agreement(rep.position, input.mine)}.`);
  } else if (input.legislators.length > 1) {
    parts.push(`Yours: ${input.legislators.map((rep) => `${rep.name} ${POSITION_WORDS[rep.position]}`).join(", ")}.`);
  }
  if (!input.mine) parts.push("Vote too, and see how often you agree.");
  return { title, body: parts.join(" "), url: input.url };
}

function agreement(theirs: Position, mine: Position | null): string {
  if (!mine || (mine !== "YEA" && mine !== "NAY") || (theirs !== "YEA" && theirs !== "NAY")) return "";
  return theirs === mine ? ", the same as you" : `, and you ${mine === "YEA" ? "supported" : "opposed"} it`;
}

export function becameLawMessage(input: { label: string; title: string; url: string }): Message {
  return { title: `${input.label} is now law`, body: `${shorten(input.title, 120)}. Tap to see how it got there.`, url: input.url };
}

function shorten(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------------------------------
// Opting in and out
// ---------------------------------------------------------------------------------------------------

/**
 * Each thing someone can be notified about, switched on or off on its own. Results are split by why the
 * bill is theirs: they followed it, voted on it, or it came up in their topics.
 */
export const NOTIFY_PREFS = {
  cityMeetings: "notify.cityMeetings",
  floorWeek: "notify.floorWeek",
  voteResults: "notify.voteResults",
  votedBills: "notify.votedBills",
  topicResults: "notify.topicResults",
  becameLaw: "notify.becameLaw",
} as const;
export type NotifyPref = keyof typeof NOTIFY_PREFS;
export const NOTIFY_PREF_NAMES = Object.keys(NOTIFY_PREFS) as NotifyPref[];

/** A topic someone tracks, but doesn't want notifications about: one preference row per topic, named by it. */
export const MUTED_TOPIC_PREFIX = "notify.topicOff:";

/** Every kind is on until someone turns it off, once they've turned on notifications at all. */
export function prefsFrom(rows: { key: string; value: string }[]): Record<NotifyPref, boolean> {
  const off = new Set(rows.filter((row) => row.value === "false").map((row) => row.key));
  return Object.fromEntries(NOTIFY_PREF_NAMES.map((name) => [name, !off.has(NOTIFY_PREFS[name])])) as Record<NotifyPref, boolean>;
}

export function mutedTopicsFrom(rows: { key: string; value: string }[]): string[] {
  return rows.filter((row) => row.key.startsWith(MUTED_TOPIC_PREFIX) && row.value === "true").map((row) => row.key.slice(MUTED_TOPIC_PREFIX.length));
}

export type NotifyChoices = { prefs: Record<NotifyPref, boolean>; mutedTopics: string[] };

/** Why a bill's vote result would go to someone. A reason only counts when its own switch is on. */
export function wantsVoteResult(
  choices: NotifyChoices,
  reasons: { follows: boolean; voted: boolean; scheduledInTopic: boolean; policyArea: string | null },
): boolean {
  if (reasons.follows && choices.prefs.voteResults) return true;
  if (reasons.voted && choices.prefs.votedBills) return true;
  return reasons.scheduledInTopic && choices.prefs.topicResults && Boolean(reasons.policyArea) && !choices.mutedTopics.includes(reasons.policyArea as string);
}

/** The topics that notifications use: the ones tracked, less the ones muted. */
export function notifyTopics(tracked: string[], muted: string[]): Set<string> {
  const off = new Set(muted);
  return new Set(tracked.filter((topic) => !off.has(topic)));
}

/** "Chrome on Windows", from a browser's user agent, so someone can tell their devices apart. */
export function deviceLabel(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : null;
  const system = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : null;
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "A browser";
}
