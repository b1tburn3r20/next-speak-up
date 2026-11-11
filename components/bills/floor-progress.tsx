"use client";

import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { XP_AMOUNTS } from "@/lib/civic/progress";
import { useCivicStore } from "@/stores/use-civic-store";

type Initial = Record<string, string | null>;

/** How many of these bills have a vote from you, counting votes cast since the page loaded. */
function useVotedCount(slugs: string[], initial: Initial): number {
  return useCivicStore((state) =>
    slugs.reduce((count, slug) => {
      const position = state.votes[slug] !== undefined ? state.votes[slug] : initial[slug];
      return count + (position === "YEA" || position === "NAY" ? 1 : 0);
    }, 0),
  );
}

/**
 * The bar over Upcoming votes: how many of the bills Congress hasn't voted on yet you've weighed in on.
 * It moves the moment you vote on a card below.
 */
export function FloorProgress({ slugs, initial }: { slugs: string[]; initial: Initial }) {
  const voted = useVotedCount(slugs, initial);
  const total = slugs.length;
  const done = total > 0 && voted >= total;
  return (
    <section className="space-y-2 rounded-2xl border-2 border-b-4 bg-card p-4" data-testid="floor-progress" aria-label="Your progress on upcoming bills">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-extrabold">
          {done ? (
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="size-5 text-streak" aria-hidden />
              You beat Congress to every bill
            </span>
          ) : (
            "Beat Congress to the vote"
          )}
        </p>
        <p className="shrink-0 text-sm font-extrabold tabular-nums" data-testid="floor-progress-count">
          {voted} of {total}
        </p>
      </div>
      <Progress value={voted} max={total} aria-label={`${voted} of ${total} upcoming bills voted on`} />
      <p className="text-sm text-muted-foreground">
        {done
          ? "Come back when the next week's list is out."
          : `Each vote earns ${XP_AMOUNTS.VOTE} XP, plus ${XP_AMOUNTS.AHEAD_OF_VOTE} more for voting before Congress does.`}
      </p>
    </section>
  );
}

/**
 * A group's count in its heading, kept true as you vote. "voted" counts the bills you've voted on, and
 * "left" the ones you haven't, so a group doesn't keep claiming bills you just did.
 */
export function LiveCount({ slugs, initial, mode }: { slugs: string[]; initial: Initial; mode: "voted" | "left" }) {
  const voted = useVotedCount(slugs, initial);
  const count = mode === "voted" ? voted : slugs.length - voted;
  return <span className="tabular-nums">{count}</span>;
}
