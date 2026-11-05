// How closely a user lines up with a representative, and how a member votes overall.

export type Position = "YEA" | "NAY" | "PRESENT" | "NOT_VOTING";

export type ComparedVote = {
  userPosition: Position;
  repPosition: Position;
  policyArea?: string | null;
};

export type Alignment = {
  compared: number;
  matched: number;
  /** Whole percent, or null when there's nothing to compare. */
  percent: number | null;
};

function percentOf(part: number, whole: number): number | null {
  return whole === 0 ? null : Math.round((part / whole) * 100);
}

/**
 * Only a clear yes or no on both sides counts. If a rep missed the vote, or the user abstained,
 * neither of them took a position, so it says nothing about whether they agree.
 */
export function isComparable(vote: ComparedVote): boolean {
  const clear = (position: Position) => position === "YEA" || position === "NAY";
  return clear(vote.userPosition) && clear(vote.repPosition);
}

export function computeAlignment(votes: ComparedVote[]): Alignment {
  const comparable = votes.filter(isComparable);
  const matched = comparable.filter((vote) => vote.userPosition === vote.repPosition).length;
  return { compared: comparable.length, matched, percent: percentOf(matched, comparable.length) };
}

export function alignmentByPolicyArea(votes: ComparedVote[]): Record<string, Alignment> {
  const groups: Record<string, ComparedVote[]> = {};
  for (const vote of votes) {
    if (!vote.policyArea) continue;
    (groups[vote.policyArea] ??= []).push(vote);
  }
  return Object.fromEntries(
    Object.entries(groups)
      .map(([area, group]) => [area, computeAlignment(group)] as const)
      .filter(([, alignment]) => alignment.compared > 0),
  );
}

export type MemberVoteRecord = {
  position: Position;
  /** The way most of the member's party voted, or null when there's no clear majority. */
  partyMajority: Position | null;
};

export type MemberVotingStats = {
  totalVotes: number;
  /** Share of votes the member showed up for. Present counts as attending. */
  attendancePercent: number | null;
  missedVotes: number;
  /** Share of their yes-or-no votes that went with their party's majority. */
  partyLoyaltyPercent: number | null;
};

export function computeMemberStats(records: MemberVoteRecord[]): MemberVotingStats {
  const missed = records.filter((record) => record.position === "NOT_VOTING").length;
  const withMajority = records.filter(
    (record) =>
      record.partyMajority !== null &&
      (record.position === "YEA" || record.position === "NAY"),
  );
  const loyal = withMajority.filter((record) => record.position === record.partyMajority).length;
  return {
    totalVotes: records.length,
    attendancePercent: percentOf(records.length - missed, records.length),
    missedVotes: missed,
    partyLoyaltyPercent: percentOf(loyal, withMajority.length),
  };
}

/** The more common of yea and nay. A tie, or no votes at all, is no majority. */
export function majorityPosition(yea: number, nay: number): Position | null {
  if (yea === nay) return null;
  return yea > nay ? "YEA" : "NAY";
}

// Built from the wording in real House and Senate data. Note that "On Agreeing to the
// Amendment" must not match: a vote on an amendment isn't a position on the whole bill.
const FINAL_VOTE =
  /^on passage|^on (the )?(joint |concurrent )?resolution|agreeing to the (joint |concurrent )?resolution|^on (agreeing to )?the conference report|suspend the rules|concur|overrid/i;

/**
 * Whether a roll call decides a bill's fate, rather than a procedural step like a motion to
 * table. A user's opinion on a bill should only be compared with votes on the bill itself.
 */
export function isFinalVote(question: string | null | undefined): boolean {
  return FINAL_VOTE.test(question ?? "");
}
