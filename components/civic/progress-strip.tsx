"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Target } from "lucide-react";
import confetti from "canvas-confetti";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor } from "@/lib/civic/ranks";
import { useCivicStore, useProgress } from "@/stores/use-civic-store";

/** Streak, level, and daily goal, as big numbers. The same values as the bar on every page. */
export function ProgressStrip({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  const { streak: liveStreak, level: liveLevel, xp: liveXp, votedToday: today, dailyGoal } = progress;
  const { rank, next, xpToNext } = rankFor(liveXp);
  const goalPercent = Math.min(100, (today / dailyGoal) * 100);
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="progress-strip">
      <div className="rounded-xl bg-streak-tint p-2.5 text-center">
        <Flame className="mx-auto size-5 text-streak" aria-hidden />
        <p className="text-lg font-extrabold leading-tight tabular-nums" data-testid="streak">
          {liveStreak}
        </p>
        <p className="text-xs font-bold">day streak</p>
      </div>
      <div className="rounded-xl bg-xp-tint p-2.5 text-center">
        <Sparkles className="mx-auto size-5 text-xp" aria-hidden />
        <p className="text-lg font-extrabold leading-tight tabular-nums" data-testid="level">
          Level {liveLevel}
        </p>
        <p className="text-xs font-bold tabular-nums">{liveXp} XP</p>
        <p className="text-xs font-bold" data-testid="strip-rank">
          {rank.name}
          {next ? `, ${xpToNext} to ${next.name}` : ""}
        </p>
      </div>
      <div className="rounded-xl bg-primary-tint p-2.5 text-center">
        <Target className="mx-auto size-5 text-primary" aria-hidden />
        <p className="text-lg font-extrabold leading-tight tabular-nums" data-testid="daily-goal">
          {today >= dailyGoal ? "Goal met!" : `${today}/${dailyGoal}`}
        </p>
        <Progress value={goalPercent} aria-label="Daily goal" className="mx-auto mt-1 h-2 max-w-20 bg-card" />
      </div>
    </div>
  );
}

/** XP flies up to the bar, and something bigger gets confetti. Lives in the layout. */
export function RewardToast() {
  const reward = useCivicStore((state) => state.reward);
  const clear = useCivicStore((state) => state.clearReward);
  const [visible, setVisible] = useState<number | null>(null);

  useEffect(() => {
    if (!reward) return;
    const showing = setTimeout(() => setVisible(reward.id), 0);
    const hiding = setTimeout(
      () => {
        setVisible(null);
        clear();
      },
      reward.celebration ? 2600 : 1100,
    );
    if (reward.celebration && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, disableForReducedMotion: true });
    }
    return () => {
      clearTimeout(showing);
      clearTimeout(hiding);
    };
  }, [reward, clear]);

  if (!reward || visible !== reward.id) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2">
      <span className="animate-xp-fly rounded-full bg-xp px-4 py-1.5 font-extrabold text-white shadow-lg" data-testid="reward">
        {reward.message}
      </span>
      {reward.celebration ? (
        <span
          className="animate-pop-in rounded-2xl border-2 border-b-4 border-streak bg-streak-tint px-5 py-2 text-lg font-extrabold"
          data-testid="celebration"
        >
          {reward.celebration}
        </span>
      ) : null}
    </div>
  );
}
