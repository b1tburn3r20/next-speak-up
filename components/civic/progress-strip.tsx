"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Target } from "lucide-react";
import { XP_PER_VOTE } from "@/lib/civic/progress";
import { useCivicStore } from "@/stores/use-civic-store";

type Props = {
  streak: number;
  xp: number;
  level: number;
  votedToday: number;
  dailyGoal: number;
};

const XP_PER_LEVEL = 100;

/** Streak, level, and daily goal. The server gives the starting point, and votes add to it live. */
export function ProgressStrip({ streak, xp, votedToday, dailyGoal }: Props) {
  const delta = useCivicStore((state) => state.voteDelta);
  const liveXp = Math.max(0, xp + delta * XP_PER_VOTE);
  const liveLevel = Math.floor(liveXp / XP_PER_LEVEL) + 1;
  const today = Math.max(0, votedToday + delta);
  // Voting today starts a streak, or continues one that was waiting on today.
  const liveStreak = votedToday === 0 && today > 0 ? streak + 1 : streak;
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
      </div>
      <div className="rounded-xl bg-primary-tint p-2.5 text-center">
        <Target className="mx-auto size-5 text-primary" aria-hidden />
        <p className="text-lg font-extrabold leading-tight tabular-nums" data-testid="daily-goal">
          {today >= dailyGoal ? "Goal met!" : `${today}/${dailyGoal}`}
        </p>
        <div className="mx-auto mt-1 h-1.5 max-w-20 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-primary" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

/** A small burst when someone earns something. Lives in the layout, and reads one store value. */
export function RewardToast() {
  const reward = useCivicStore((state) => state.reward);
  const clear = useCivicStore((state) => state.clearReward);
  const [visible, setVisible] = useState<number | null>(null);

  useEffect(() => {
    if (!reward) return;
    const showing = setTimeout(() => setVisible(reward.id), 0);
    const hiding = setTimeout(() => {
      setVisible(null);
      clear();
    }, 1400);
    return () => {
      clearTimeout(showing);
      clearTimeout(hiding);
    };
  }, [reward, clear]);

  if (!reward || visible !== reward.id) return null;
  return (
    <div
      role="status"
      className="animate-pop-in pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-xp px-4 py-1.5 font-extrabold text-white shadow-lg"
      data-testid="reward"
    >
      {reward.message}
    </div>
  );
}
