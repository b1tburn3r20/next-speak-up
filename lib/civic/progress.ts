// Streaks, levels, and badges, all worked out from real votes. No database access here.

import { newRank } from "./ranks";

const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_GOAL = 3;
export const XP_PER_VOTE = 10;
export const XP_PER_LEVEL = 100;

/** What each action earns. Support and Oppose earn the same. */
export const XP_AMOUNTS = {
  VOTE: XP_PER_VOTE,
  AHEAD_OF_VOTE: 5,
  DAILY_GOAL: 20,
  CONTACTED_REP: 25,
  ATTENDED_EVENT: 50,
} as const;

export const XP_KIND_LABELS: Record<keyof typeof XP_AMOUNTS, string> = {
  VOTE: "Voted on a bill",
  AHEAD_OF_VOTE: "Voted before the House could",
  DAILY_GOAL: "Met your daily goal",
  CONTACTED_REP: "Said you contacted a rep",
  ATTENDED_EVENT: "Said you attended a meeting",
};

/** Everything the bar on every page needs. */
export type HudProgress = {
  userId: string;
  xp: number;
  level: number;
  levelPercent: number;
  xpToNextLevel: number;
  streak: number;
  votesCast: number;
  votedToday: number;
  dailyGoal: number;
};

export function levelFor(xp: number) {
  const safe = Math.max(0, xp);
  return {
    level: Math.floor(safe / XP_PER_LEVEL) + 1,
    levelPercent: safe % XP_PER_LEVEL,
    xpToNextLevel: XP_PER_LEVEL - (safe % XP_PER_LEVEL),
  };
}

/** When today began in Eastern time, including across clock changes. */
export function easternMidnight(now: Date): Date {
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace("GMT", "") || "-05:00";
  return new Date(`${dateKey(now)}T00:00:00${offset}`);
}

/** A calendar day in Eastern time, like "2026-11-06". */
export function dateKey(date: Date, timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export type Badge = { id: string; label: string; description: string; earned: boolean };

export type UserProgress = {
  votesCast: number;
  xp: number;
  level: number;
  /** How far through the current level, from 0 to 100. */
  levelPercent: number;
  xpToNextLevel: number;
  /** Days in a row with a vote. Still counts today if they voted yesterday. */
  streak: number;
  votedToday: number;
  dailyGoal: number;
  dailyGoalMet: boolean;
  badges: Badge[];
};

function dayNumber(date: Date, timeZone: string): number {
  const text = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return Math.floor(new Date(`${text}T00:00:00Z`).getTime() / DAY_MS);
}

/** A streak survives until a full day passes without a vote, so it isn't lost in the morning. */
export function computeStreak(votes: Date[], now: Date, timeZone = "America/New_York"): number {
  if (votes.length === 0) return 0;
  const days = new Set(votes.map((vote) => dayNumber(vote, timeZone)));
  const today = dayNumber(now, timeZone);
  let day = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}

export function computeHud(input: {
  userId: string;
  xp: number;
  votesCast: number;
  voteDates: Date[];
  now: Date;
  timeZone?: string;
}): HudProgress {
  const { voteDates, now, timeZone = "America/New_York" } = input;
  const today = dayNumber(now, timeZone);
  return {
    userId: input.userId,
    xp: input.xp,
    ...levelFor(input.xp),
    streak: computeStreak(voteDates, now, timeZone),
    votesCast: input.votesCast,
    votedToday: voteDates.filter((vote) => dayNumber(vote, timeZone) === today).length,
    dailyGoal: DAILY_GOAL,
  };
}

/**
 * The bar's next state right after a vote, before the server answers. `change` is +1 for a new vote
 * and -1 for an undo. The server's answer replaces this, so it only has to be right about what shows
 * in the next fraction of a second.
 */
export function applyVote(progress: HudProgress, change: number): HudProgress {
  if (change === 0) return progress;
  const votedToday = Math.max(0, progress.votedToday + change);
  const crossedGoal = change > 0 && progress.votedToday < progress.dailyGoal && votedToday >= progress.dailyGoal;
  const uncrossedGoal = change < 0 && progress.votedToday >= progress.dailyGoal && votedToday < progress.dailyGoal;
  const bonus = crossedGoal ? XP_AMOUNTS.DAILY_GOAL : uncrossedGoal ? -XP_AMOUNTS.DAILY_GOAL : 0;
  const xp = Math.max(0, progress.xp + change * XP_PER_VOTE + bonus);
  // Today's first vote starts a streak, or continues one that was waiting on today.
  const startedToday = change > 0 && progress.votedToday === 0;
  const clearedToday = change < 0 && votedToday === 0;
  const streak = startedToday ? progress.streak + 1 : clearedToday ? Math.max(0, progress.streak - 1) : progress.streak;
  return { ...progress, xp, ...levelFor(xp), votesCast: Math.max(0, progress.votesCast + change), votedToday, streak };
}

/** What just happened that's worth celebrating, comparing before and after. */
/**
 * Everything a vote just earned that deserves more than "+10 XP", biggest first. One vote can earn
 * several, like a new rank and today's goal, and each gets its turn on screen.
 */
export function celebrate(before: HudProgress, after: HudProgress): string[] {
  const found: string[] = [];
  const rank = newRank(before.xp, after.xp);
  if (rank) found.push(`New rank: ${rank.name}!`);
  // A new rank already says you moved up, so a level on the same vote would repeat it.
  else if (after.level > before.level) found.push(`Level ${after.level}!`);
  if (before.votedToday < before.dailyGoal && after.votedToday >= after.dailyGoal) found.push("Daily goal met!");
  for (const [votes, label] of [[1, "First vote"], [10, "Regular"], [50, "Civic regular"]] as const) {
    if (before.votesCast < votes && after.votesCast >= votes) found.push(`Badge earned: ${label}`);
  }
  if (before.streak < 7 && after.streak >= 7) found.push("Badge earned: Full week");
  return found;
}

export function computeProgress(input: {
  /** From the XP ledger. Left out, it's worked out from votes alone. */
  xp?: number;
  voteDates: Date[];
  now: Date;
  repsFound: boolean;
  bestMatchCompared: number;
  floorVotes: number;
  policyAreasVoted: number;
  /** Only for people in a state we cover. Attending is self-reported, and the badges say so. */
  state?: { stateName: string; votes: number; attended: number; cityAttended: number; seatsFound: boolean };
  timeZone?: string;
}): UserProgress {
  const { voteDates, now, timeZone = "America/New_York" } = input;
  const votesCast = voteDates.length;
  const xp = input.xp ?? votesCast * XP_PER_VOTE;
  const today = dayNumber(now, timeZone);
  const votedToday = voteDates.filter((vote) => dayNumber(vote, timeZone) === today).length;
  const streak = computeStreak(voteDates, now, timeZone);
  const longestStreakCheck = streak;
  const badges: Badge[] = [
    {
      id: "found-reps",
      label: "Found my reps",
      description: "You know who represents you",
      earned: input.repsFound,
    },
    { id: "first-vote", label: "First vote", description: "Weighed in on a bill", earned: votesCast >= 1 },
    {
      id: "compared",
      label: "Scorecard",
      description: "Voted on 3 bills your rep voted on too",
      earned: input.bestMatchCompared >= 3,
    },
    { id: "ten-votes", label: "Regular", description: "Cast 10 votes", earned: votesCast >= 10 },
    {
      id: "ahead",
      label: "Ahead of Congress",
      description: "Weighed in on a bill before the House took it up",
      earned: input.floorVotes >= 1,
    },
    { id: "week-streak", label: "Full week", description: "Voted 7 days in a row", earned: longestStreakCheck >= 7 },
    {
      id: "well-read",
      label: "Well rounded",
      description: "Voted in 5 different policy areas",
      earned: input.policyAreasVoted >= 5,
    },
    { id: "fifty-votes", label: "Civic regular", description: "Cast 50 votes", earned: votesCast >= 50 },
    ...(input.state
      ? [
          { id: "know-your-people", label: "Know your people", description: `Found your ${input.state.stateName} legislators`, earned: input.state.seatsFound },
          { id: "statehouse-regular", label: "Statehouse regular", description: `Voted on 10 bills from ${input.state.stateName}`, earned: input.state.votes >= 10 },
          { id: "showed-up", label: "Showed up", description: "Said you went to a statehouse meeting", earned: input.state.attended >= 1 },
          { id: "city-hall-regular", label: "City Hall regular", description: "Said you went to a city council meeting", earned: input.state.cityAttended >= 1 },
        ]
      : []),
  ];
  return {
    votesCast,
    xp,
    ...levelFor(xp),
    streak,
    votedToday,
    dailyGoal: DAILY_GOAL,
    dailyGoalMet: votedToday >= DAILY_GOAL,
    badges,
  };
}
