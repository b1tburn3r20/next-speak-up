"use client";

import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { useProgress } from "@/stores/use-civic-store";

/** Your level, big, with how far it is to the next one. */
export function LevelCard({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  return (
    <div className="rounded-3xl border-2 border-b-8 border-xp bg-xp-tint p-5 sm:p-7" data-testid="level-card">
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-xp text-white">
          <Sparkles className="size-8" aria-hidden />
        </span>
        <div className="min-w-0">
          <p key={progress.level} className="animate-pop-in text-3xl font-extrabold leading-tight" data-testid="level-number">
            Level {progress.level}
          </p>
          <p className="font-bold tabular-nums">{progress.xp} XP in total</p>
        </div>
      </div>
      <Progress
        value={progress.levelPercent}
        aria-label={`${progress.xpToNextLevel} XP to level ${progress.level + 1}`}
        className="mt-4 h-5 bg-card"
        data-testid="level-bar"
      />
      <p className="mt-2 text-sm font-bold" data-testid="level-next">
        {progress.xpToNextLevel} XP to level {progress.level + 1}
      </p>
    </div>
  );
}
