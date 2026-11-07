// Quests, the policy chart, and the anonymous split. No database access here.
import { routes, stateRoutes } from "@/lib/routes";

/** How someone voted on bills in one policy area. It's about these bills, not the whole topic. */
export type PolicyLean = { area: string; support: number; oppose: number };

export function policyLean(votes: { position: string; policyArea: string | null }[], limit = 8): PolicyLean[] {
  const areas = new Map<string, PolicyLean>();
  for (const { position, policyArea } of votes) {
    if (!policyArea || (position !== "YEA" && position !== "NAY")) continue;
    const row = areas.get(policyArea) ?? { area: policyArea, support: 0, oppose: 0 };
    if (position === "YEA") row.support += 1;
    else row.oppose += 1;
    areas.set(policyArea, row);
  }
  return [...areas.values()]
    .sort((a, b) => b.support + b.oppose - (a.support + a.oppose) || a.area.localeCompare(b.area))
    .slice(0, limit);
}

/** What moved since last time, for the chart's +1 and -1. New areas count from zero. */
export function leanChanges(previous: PolicyLean[], current: PolicyLean[]) {
  const before = new Map(previous.map((row) => [row.area, row]));
  return new Map(
    current.map((row) => [
      row.area,
      {
        support: row.support - (before.get(row.area)?.support ?? 0),
        oppose: row.oppose - (before.get(row.area)?.oppose ?? 0),
      },
    ]),
  );
}

/** One from each in turn, starting with the first, then whatever's left. */
export function interleave<T>(first: T[], second: T[]): T[] {
  const merged: T[] = [];
  for (let index = 0; index < Math.max(first.length, second.length); index += 1) {
    if (index < first.length) merged.push(first[index]);
    if (index < second.length) merged.push(second[index]);
  }
  return merged;
}

export type Quest = {
  id: string;
  title: string;
  current: number;
  goal: number;
  done: boolean;
  href: string;
  /** Extra XP for finishing, when there is some. */
  bonusXp?: number;
};

/** Three things to do today, all checked against what really happened. */
export function computeQuests(input: {
  votedToday: number;
  dailyGoal: number;
  openVotesToday: number;
  topicVotesToday: number;
  trackedTopics: number;
  dailyGoalXp: number;
  /** Only for Iowans. */
  iowaVotesToday?: number;
}): Quest[] {
  const quest = (id: string, title: string, current: number, goal: number, href: string, bonusXp?: number): Quest => ({
    id,
    title,
    current: Math.min(current, goal),
    goal,
    done: current >= goal,
    href,
    bonusXp,
  });
  return [
    quest("daily-goal", `Vote on ${input.dailyGoal} bills`, input.votedToday, input.dailyGoal, routes.vote, input.dailyGoalXp),
    quest("still-open", "Vote on a bill Congress hasn't decided", input.openVotesToday, 1, routes.vote),
    input.trackedTopics > 0
      ? quest("your-topic", "Vote on a topic you track", input.topicVotesToday, 1, routes.vote)
      : quest("pick-topics", "Pick a topic to track", 0, 1, routes.federal.topics),
    ...(input.iowaVotesToday === undefined
      ? []
      : [quest("iowa-bill", "Vote on an Iowa bill", input.iowaVotesToday, 1, stateRoutes.bills)]),
  ];
}

/** Below this, a percentage says little, and could point to individual people. */
export const MIN_SPLIT_VOTES = 20;

export type CommunitySplit = { label: string; supportPercent: number; total: number };

export function communitySplit(label: string, support: number, oppose: number): CommunitySplit | null {
  const total = support + oppose;
  if (total < MIN_SPLIT_VOTES) return null;
  return { label, supportPercent: Math.round((support / total) * 100), total };
}

export type MatchRecord = { matched: number; compared: number };

const asPercent = ({ matched, compared }: MatchRecord) => (compared === 0 ? null : Math.round((matched / compared) * 100));

/**
 * How one vote moves your match with a rep. `base` leaves this bill out, so it's still right if you
 * change your mind. A rep who didn't vote, or a vote not yet cast, doesn't count.
 */
export function matchMove(base: MatchRecord, userPosition: string | null, repPosition: string | null) {
  const counts = (userPosition === "YEA" || userPosition === "NAY") && (repPosition === "YEA" || repPosition === "NAY");
  const after = counts
    ? { matched: base.matched + (userPosition === repPosition ? 1 : 0), compared: base.compared + 1 }
    : base;
  return { before: asPercent(base), after: asPercent(after), counted: counts };
}

/** Monday in Eastern time, when the leaderboard resets. */
export function weekStart(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZoneName: "longOffset",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const offset = get("timeZoneName").replace("GMT", "") || "-05:00";
  const daysSinceMonday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  const today = Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")));
  const monday = new Date(today - daysSinceMonday * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return new Date(`${monday}T00:00:00${offset}`);
}
