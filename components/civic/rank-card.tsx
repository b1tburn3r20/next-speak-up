"use client";

import { Check, Lock, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor, RANKS } from "@/lib/civic/ranks";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/use-civic-store";

/** Your rank, the XP goal for the next one, and the whole ladder. It moves as you earn. */
export function RankCard({ initial }: { initial: HudProgress }) {
  const { xp } = useProgress(initial);
  const { rank, next, percent, xpToNext, position, votesToNext } = rankFor(xp);
  return (
    <div className="space-y-4 rounded-3xl border-2 border-b-8 border-streak bg-streak-tint p-5 sm:p-7" data-testid="rank-card">
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-streak text-streak-foreground">
          <Medal className="size-8" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-muted-foreground">
            Rank {position} of {RANKS.length}
          </p>
          <p key={rank.name} className="animate-pop-in break-words text-3xl font-extrabold leading-tight" data-testid="rank-name">
            {rank.name}
          </p>
        </div>
      </div>
      {next ? (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm font-extrabold">
            <span className="tabular-nums">{xp} XP</span>
            <span className="tabular-nums">
              {next.name} at {next.xp} XP
            </span>
          </div>
          <Progress
            value={percent}
            aria-label={`${xpToNext} XP to ${next.name}`}
            className="h-5 bg-card"
            data-testid="rank-bar"
          />
          <p className="text-sm font-bold" data-testid="rank-next">
            {xpToNext} XP to {next.name}. That&apos;s about {votesToNext} more vote{votesToNext === 1 ? "" : "s"}.
          </p>
        </div>
      ) : (
        <p className="font-bold" data-testid="rank-next">
          You&apos;ve reached the top rank, with {xp} XP. Thank you for taking part.
        </p>
      )}
      <ol className="grid grid-cols-1 gap-1 sm:grid-cols-3" aria-label="All ranks" data-testid="rank-ladder">
        {RANKS.map((step, index) => {
          const reached = xp >= step.xp;
          const current = index + 1 === position;
          return (
            <li
              key={step.name}
              aria-current={current ? "step" : undefined}
              data-reached={reached}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2 py-1 text-sm",
                current && "bg-card font-extrabold",
                !reached && "text-muted-foreground",
              )}
            >
              {reached ? <Check className="size-4 shrink-0 text-support" aria-hidden /> : <Lock className="size-3.5 shrink-0" aria-hidden />}
              <span className="min-w-0 flex-1 break-words">{step.name}</span>
              <span className="text-xs font-bold tabular-nums">{step.xp}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
