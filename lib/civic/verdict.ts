// Turns numbers into words a person can act on. Only the user's own votes decide whether someone
// represents them. Job measures compare a member with their chamber, and never judge a party.

export const MIN_VOTES_FOR_VERDICT = 3;

export type VerdictTone = "good" | "mixed" | "bad" | "unknown";

export type AlignmentVerdict = {
  tone: VerdictTone;
  /** Short enough for a badge. */
  label: string;
  /** A sentence that says what to make of it. */
  detail: string;
  /** Null until there are enough shared votes to mean anything. */
  percent: number | null;
  /** How many more shared votes until there's a verdict. */
  votesNeeded: number;
};

export function alignmentVerdict(compared: number, matched: number): AlignmentVerdict {
  if (compared < MIN_VOTES_FOR_VERDICT) {
    const votesNeeded = MIN_VOTES_FOR_VERDICT - compared;
    return {
      tone: "unknown",
      label: "Not enough votes yet",
      detail: `Vote on ${votesNeeded} more bill${votesNeeded === 1 ? "" : "s"} they've voted on to find out.`,
      percent: null,
      votesNeeded,
    };
  }
  const percent = Math.round((matched / compared) * 100);
  const basis = `You agreed on ${matched} of ${compared} bills.`;
  if (percent >= 70) {
    return {
      tone: "good",
      label: "Represents you",
      detail: `${basis} They usually vote the way you would.`,
      percent,
      votesNeeded: 0,
    };
  }
  if (percent >= 40) {
    return {
      tone: "mixed",
      label: "Sometimes represents you",
      detail: `${basis} It could go either way.`,
      percent,
      votesNeeded: 0,
    };
  }
  return {
    tone: "bad",
    label: "Doesn't represent you",
    detail: `${basis} They usually vote differently from you.`,
    percent,
    votesNeeded: 0,
  };
}

export type RevealPosition = "YEA" | "NAY" | "PRESENT" | "NOT_VOTING" | null;

export type RevealOutcome = "MATCH" | "DIFFERENT" | "DID_NOT_VOTE" | "NO_RECORD";

/** Whether a rep's vote matches yours. Missing a vote is neither agreeing nor disagreeing. */
export function revealOutcome(user: string | null, rep: RevealPosition): RevealOutcome {
  if (rep === null) return "NO_RECORD";
  if (rep === "NOT_VOTING" || rep === "PRESENT") return "DID_NOT_VOTE";
  if (user !== "YEA" && user !== "NAY") return "NO_RECORD";
  return user === rep ? "MATCH" : "DIFFERENT";
}

/** "Higher than 72% of the House", or nothing when there's no data. */
export function comparedToChamber(
  percentile: number | null | undefined,
  chamberKind: string,
): string | null {
  if (percentile === null || percentile === undefined) return null;
  const chamber = chamberKind === "UPPER" ? "Senate" : "House";
  return `Higher than ${percentile}% of the ${chamber}`;
}

/** Where someone differs most from you, needing at least two votes in that area to say so. */
export function biggestDifference<T extends { compared: number; percent: number }>(
  areas: T[],
): T | null {
  const candidates = areas.filter((item) => item.compared >= 2 && item.percent < 50);
  return [...candidates].sort((a, b) => a.percent - b.percent || b.compared - a.compared)[0] ?? null;
}

/** A plain description of how the last stretch went, without pretending zero means something. */
export function recapSentence(input: {
  votes: number;
  missed: number;
  lastCongressVote: Date | null;
  days: number;
}): string {
  const { votes, missed, lastCongressVote, days } = input;
  if (votes + missed === 0) {
    if (!lastCongressVote) return "No recorded votes yet.";
    const date = lastCongressVote.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return `No recorded votes in the last ${days} days. Their chamber's last one we have is from ${date}.`;
  }
  const total = votes + missed;
  if (missed === 0) {
    return `Voted on all ${total} recorded votes in the last ${days} days.`;
  }
  return `Voted on ${votes} of ${total} recorded votes in the last ${days} days, and missed ${missed}.`;
}

const RECORD_VOTE = /Record Vote Number:\s*(\d+)/i;

/**
 * Senate votes that bill actions mention, but whose member positions aren't in yet. Actions are
 * immediate, while positions come from Voteview, which can lag. Odd years are a Congress's first
 * session.
 */
export function missingSenateVotes(
  actions: { text: string; actionDate: Date }[],
  rollCalls: { number: number; subSession: number; chamber: { kind: string } }[],
): number[] {
  const stored = new Set(
    rollCalls
      .filter((rollCall) => rollCall.chamber.kind === "UPPER")
      .map((rollCall) => `${rollCall.subSession}-${rollCall.number}`),
  );
  const missing = new Set<number>();
  for (const action of actions) {
    const match = RECORD_VOTE.exec(action.text);
    if (!match) continue;
    const session = action.actionDate.getUTCFullYear() % 2 === 1 ? 1 : 2;
    if (!stored.has(`${session}-${match[1]}`)) missing.add(Number(match[1]));
  }
  return [...missing];
}
