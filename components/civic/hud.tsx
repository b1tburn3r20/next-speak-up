"use client";

import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor } from "@/lib/civic/ranks";
import { profilePath, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/use-civic-store";

const ITEM = "tap inline-flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-muted";

/** A small ring that fills toward today's goal. */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const percent = Math.min(100, (value / goal) * 100);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const met = value >= goal;
  return (
    <>
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
    </>
  );
}

/**
 * Your streak, level, and XP, on every page. Each part goes somewhere: the streak to your profile,
 * today's goal to voting, and your rank and level to your progress.
 */
export function Hud({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  const { rank, next, xpToNext } = rankFor(progress.xp);
  const goalMet = progress.votedToday >= progress.dailyGoal;
  return (
    <div className="flex items-center gap-1 sm:gap-2" data-testid="hud">
      <Link
        href={profilePath(progress.userId)}
        className={ITEM}
        aria-label={`${progress.streak} day streak. Your profile`}
        title="Your profile"
        data-testid="hud-streak"
      >
        <Flame key={progress.streak} className={cn("animate-pop-in size-5", progress.streak > 0 ? "text-streak" : "text-muted-foreground")} aria-hidden />
        <span className="text-sm font-extrabold tabular-nums">{progress.streak}</span>
      </Link>
      <Link
        href={routes.vote}
        className={cn(ITEM, "hidden sm:inline-flex")}
        aria-label={goalMet ? "Daily goal met. Vote on more bills" : `${progress.votedToday} of ${progress.dailyGoal} votes today. Vote on a bill`}
        title={goalMet ? "Daily goal met" : `${progress.votedToday} of ${progress.dailyGoal} votes today`}
        data-testid="hud-goal"
      >
        <GoalRing value={progress.votedToday} goal={progress.dailyGoal} />
      </Link>
      <Link
        href={routes.progress}
        className={cn(ITEM, "gap-1.5")}
        aria-label={`${rank.name}, level ${progress.level}, ${progress.xp} XP. Your progress`}
        title={next ? `${rank.name}. ${xpToNext} XP to ${next.name}` : rank.name}
        data-testid="hud-link"
      >
        <Sparkles className="size-5 text-xp" aria-hidden />
        <span key={`level-${progress.level}`} className="animate-pop-in whitespace-nowrap text-sm font-extrabold" data-testid="hud-level">
          Lv {progress.level}
        </span>
        <span className="hidden text-sm font-bold text-muted-foreground xl:inline" data-testid="hud-rank">
          {rank.name}
        </span>
        <span className="hidden w-28 lg:block">
          <Progress value={progress.levelPercent} aria-hidden className="h-3" data-testid="hud-xp-bar" />
        </span>
        <span key={`xp-${progress.xp}`} className="animate-pop-in hidden text-sm font-extrabold tabular-nums text-xp sm:inline" data-testid="hud-xp">
          {progress.xp} XP
        </span>
      </Link>
    </div>
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
