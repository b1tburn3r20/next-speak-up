// Named goals to work toward, each at a total amount of XP. Levels tick up every 100 XP, and ranks are
// the milestones between them. No database access here, and no rank says anything about a person's views.
import { XP_PER_VOTE } from "./progress";

export type Rank = { name: string; xp: number };

/** In order, starting at zero. Names avoid "citizen" and "voter": not everyone here is either. */
export const RANKS: readonly Rank[] = [
  { name: "Newcomer", xp: 0 },
  { name: "Listener", xp: 50 },
  { name: "Neighbor", xp: 150 },
  { name: "Constituent", xp: 300 },
  { name: "Participant", xp: 600 },
  { name: "Advocate", xp: 1000 },
  { name: "Organizer", xp: 2000 },
  { name: "Civic Leader", xp: 3500 },
  { name: "Statesperson", xp: 5000 },
];

export type RankProgress = {
  rank: Rank;
  /** Null at the top rank. */
  next: Rank | null;
  /** How far from this rank to the next, from 0 to 100. */
  percent: number;
  xpToNext: number;
  /** One-based, for "Rank 3 of 9". */
  position: number;
  /** A rough sense of the distance. Votes aren't the only way to earn. */
  votesToNext: number;
};

export function rankFor(xp: number): RankProgress {
  const total = Math.max(0, xp);
  let index = 0;
  for (let candidate = 0; candidate < RANKS.length; candidate += 1) {
    if (total >= RANKS[candidate].xp) index = candidate;
  }
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  if (!next) return { rank, next: null, percent: 100, xpToNext: 0, position: index + 1, votesToNext: 0 };
  const xpToNext = next.xp - total;
  return {
    rank,
    next,
    percent: Math.floor(((total - rank.xp) / (next.xp - rank.xp)) * 100),
    xpToNext,
    position: index + 1,
    votesToNext: Math.ceil(xpToNext / XP_PER_VOTE),
  };
}

/** The rank just reached, if this change crossed one. An undo that drops a rank isn't celebrated. */
export function newRank(beforeXp: number, afterXp: number): Rank | null {
  const before = rankFor(beforeXp).position;
  const after = rankFor(afterXp);
  return after.position > before ? after.rank : null;
}
