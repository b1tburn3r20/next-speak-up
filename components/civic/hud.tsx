"use client";

import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor } from "@/lib/civic/ranks";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/use-civic-store";

/** A small ring that fills toward today's goal. */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const percent = Math.min(100, (value / goal) * 100);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const met = value >= goal;
  return (
    <span
      className="inline-flex items-center gap-1"
      title={met ? "Daily goal met" : `${value} of ${goal} votes today`}
      data-testid="hud-goal"
    >
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden>
        <circle cx="12" cy="12" r={radius} fill="none" strokeWidth="4" className="stroke-background-dark" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={cn("transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none", met ? "stroke-support" : "stroke-primary")}
        />
      </svg>
      <span className="text-sm font-extrabold tabular-nums">
        {Math.min(value, goal)}/{goal}
      </span>
    </span>
  );
}

/** Your streak, level, and XP. It's on every page, and moves the moment you earn something. */
export function Hud({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  const { rank, next, xpToNext } = rankFor(progress.xp);
  return (
    <Link
      href={routes.progress}
      aria-label={`Your progress: ${rank.name}, level ${progress.level}, ${progress.xp} XP, ${progress.streak} day streak`}
      title={next ? `${rank.name}. ${xpToNext} XP to ${next.name}` : rank.name}
      className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-muted"
      data-testid="hud-link"
    >
      <span className="flex items-center gap-3" data-testid="hud">
      <span
        key={`streak-${progress.streak}`}
        className="animate-pop-in inline-flex items-center gap-1"
        title={`${progress.streak} day streak`}
        data-testid="hud-streak"
      >
        <Flame className={cn("size-5", progress.streak > 0 ? "text-streak" : "text-muted-foreground")} aria-hidden />
        <span className="text-sm font-extrabold tabular-nums">
          {progress.streak}
          <span className="sr-only"> day streak</span>
        </span>
      </span>
      <span className="hidden sm:inline-flex">
        <GoalRing value={progress.votedToday} goal={progress.dailyGoal} />
      </span>
      <span className="inline-flex items-center gap-1.5" data-testid="hud-level">
        <Sparkles className="size-5 text-xp" aria-hidden />
        <span key={`level-${progress.level}`} className="animate-pop-in text-sm font-extrabold">
          Lv {progress.level}
        </span>
        <span className="hidden text-sm font-bold text-muted-foreground xl:inline" data-testid="hud-rank">
          {rank.name}
        </span>
        <span className="hidden w-28 lg:block">
          <Progress
            value={progress.levelPercent}
            aria-label={`${progress.xpToNextLevel} XP to level ${progress.level + 1}`}
            className="h-3"
            data-testid="hud-xp-bar"
          />
        </span>
        <span key={`xp-${progress.xp}`} className="animate-pop-in hidden text-sm font-extrabold tabular-nums text-xp sm:inline" data-testid="hud-xp">
          {progress.xp} XP
        </span>
      </span>
      </span>
    </Link>
  );
}

/** The phone's version of the XP bar: a slim strip under the top bar. */
export function HudStrip({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  return (
    <Progress
      value={progress.levelPercent}
      aria-label={`${progress.xp} XP. ${progress.xpToNextLevel} XP to level ${progress.level + 1}`}
      className="h-1.5 rounded-none"
      data-testid="hud-strip"
    />
  );
}
