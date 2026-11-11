// What a celebration is, so each kind can look like itself. Pure logic.

export type CelebrationKind = "rank" | "level" | "goal" | "badge" | "thanks";

/** Reads the kind from what `celebrate` in progress.ts says, which is the one place that decides it. */
export function celebrationKind(message: string): CelebrationKind {
  if (message.startsWith("New rank")) return "rank";
  if (message.startsWith("Level")) return "level";
  if (message.startsWith("Daily goal")) return "goal";
  if (message.startsWith("Badge")) return "badge";
  return "thanks";
}

/** The line under the headline, so a celebration says why it happened. */
export function celebrationDetail(kind: CelebrationKind): string {
  switch (kind) {
    case "rank":
      return "Every vote moves you up. See what's next on Progress.";
    case "level":
      return "100 more XP to the next one.";
    case "goal":
      return "That's today's votes done. Come back tomorrow to keep your streak.";
    case "badge":
      return "It's on your profile now.";
    case "thanks":
      return "Telling your reps what you think is how they find out.";
  }
}

/** Where a number is on its way from `from` to `to`, `elapsed` ms into `duration`. Eases out, and lands exactly. */
export function countUpValue(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  const t = Math.max(0, elapsed) / duration;
  const eased = 1 - (1 - t) ** 3;
  return Math.round(from + (to - from) * eased);
}
