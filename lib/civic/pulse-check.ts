// A pulse check: a quick run of a few bills one member has voted on, then how you lined up with them on
// just those. Pure logic.

import { revealOutcome, type RevealOutcome } from "./verdict";

export const PULSE_SIZES = [3, 5, 10] as const;
export type PulseSize = (typeof PULSE_SIZES)[number];
const DEFAULT_SIZE: PulseSize = 5;

/** The size someone asked for, or 5 if it isn't one we offer. */
export function pulseSize(raw: string | string[] | null | undefined): PulseSize {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PULSE_SIZES as readonly number[]).includes(value) ? (value as PulseSize) : DEFAULT_SIZE;
}

export type PulseVote = { slug: string; label: string; title: string; you: string; them: string | null };
export type PulseRow = PulseVote & { outcome: RevealOutcome };

export type PulseSummary = {
  rows: PulseRow[];
  /** Bills where both of you took a side. */
  compared: number;
  matched: number;
  percent: number | null;
};

/** How you and the member lined up on the bills in this run. A missed vote isn't counted against them. */
export function summarizePulse(votes: PulseVote[]): PulseSummary {
  const rows = votes.map((vote) => ({ ...vote, outcome: revealOutcome(vote.you, (vote.them as Parameters<typeof revealOutcome>[1]) ?? null) }));
  const compared = rows.filter((row) => row.outcome === "MATCH" || row.outcome === "DIFFERENT").length;
  const matched = rows.filter((row) => row.outcome === "MATCH").length;
  return { rows, compared, matched, percent: compared === 0 ? null : Math.round((matched / compared) * 100) };
}

/** One plain sentence for the top of the summary. */
export function pulseHeadline(firstName: string, summary: PulseSummary): string {
  if (summary.compared === 0) return `Vote on a bill or two, and you'll see whether ${firstName} voted like you.`;
  if (summary.matched === summary.compared) return `You and ${firstName} agreed on all ${summary.compared}.`;
  if (summary.matched === 0) return `You and ${firstName} disagreed on all ${summary.compared}.`;
  return `You and ${firstName} agreed on ${summary.matched} of ${summary.compared}.`;
}
