// Streaks, levels, and badges, all worked out from real votes. No database access here.

const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_GOAL = 3;
export const XP_PER_VOTE = 10;
const XP_PER_LEVEL = 100;

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

export function computeProgress(input: {
  voteDates: Date[];
  now: Date;
  repsFound: boolean;
  bestMatchCompared: number;
  floorVotes: number;
  policyAreasVoted: number;
  timeZone?: string;
}): UserProgress {
  const { voteDates, now, timeZone = "America/New_York" } = input;
  const votesCast = voteDates.length;
  const xp = votesCast * XP_PER_VOTE;
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
  ];
  return {
    votesCast,
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelPercent: xp % XP_PER_LEVEL,
    xpToNextLevel: XP_PER_LEVEL - (xp % XP_PER_LEVEL),
    streak,
    votedToday,
    dailyGoal: DAILY_GOAL,
    dailyGoalMet: votedToday >= DAILY_GOAL,
    badges,
  };
}
