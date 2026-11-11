"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Flame, Sparkles } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor } from "@/lib/civic/ranks";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/use-civic-store";

const ITEM = "tap inline-flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-muted";

/**
 * A small ring that fills toward today's goal. The moment it's met, it pops and turns into a check.
 * A goal already met when the page loads doesn't pop, so it only celebrates what just happened.
 */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const percent = Math.min(100, (value / goal) * 100);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const met = value >= goal;
  // Remembered from the last render, so a change from not met to met is noticed during render.
  const [wasMet, setWasMet] = useState(met);
  const [bursts, setBursts] = useState(0);
  if (met !== wasMet) {
    setWasMet(met);
    if (met) setBursts((count) => count + 1);
  }
  return (
    <>
      <span key={bursts} className={cn("relative inline-flex", bursts > 0 && "animate-goal-burst")} data-testid="hud-goal-ring" data-met={met}>
        <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden>
          <circle cx="12" cy="12" r={radius} fill="none" strokeWidth="4" className="stroke-background-dark" />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill={met ? "var(--support)" : "none"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            className={cn("transition-[stroke-dashoffset,fill] duration-500 motion-reduce:transition-none", met ? "stroke-support" : "stroke-primary")}
          />
        </svg>
        {met ? <Check className="absolute inset-0 m-auto size-3.5 text-support-foreground" strokeWidth={4} aria-hidden /> : null}
      </span>
      <span className="text-sm font-extrabold tabular-nums">
        {Math.min(value, goal)}/{goal}
      </span>
    </>
  );
}

/**
 * Your streak, level, and XP, on every page, as one link to your progress, where all three are
 * explained. When you earn XP, the number counts up as the +XP chip lands, and the level glows.
 */
export function Hud({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  const { rank, next, xpToNext } = rankFor(progress.xp);
  const goalMet = progress.votedToday >= progress.dailyGoal;
  // The +XP chip takes about 0.7 seconds to fly up here, so the count waits for it.
  const xp = useCountUp(progress.xp, 650, 700);
  const [lastXp, setLastXp] = useState(progress.xp);
  const [glows, setGlows] = useState(0);
  if (progress.xp !== lastXp) {
    setLastXp(progress.xp);
    if (progress.xp > lastXp) setGlows((count) => count + 1);
  }
  return (
    <Link
      href={routes.progress}
      className={cn(ITEM, "gap-2 px-2 sm:gap-3")}
      aria-label={`Your progress: ${progress.streak} day streak, ${goalMet ? "today's goal met" : `${progress.votedToday} of ${progress.dailyGoal} votes today`}, ${rank.name}, level ${progress.level}, ${progress.xp} XP`}
      title={next ? `${rank.name}. ${xpToNext} XP to ${next.name}` : rank.name}
      data-testid="hud"
    >
      <span className="inline-flex items-center gap-1" data-testid="hud-streak">
        <Flame key={progress.streak} className={cn("animate-pop-in size-5", progress.streak > 0 ? "text-streak" : "text-muted-foreground")} aria-hidden />
        <span className="text-sm font-extrabold tabular-nums">{progress.streak}</span>
      </span>
      <span className="hidden items-center gap-1 sm:inline-flex" data-testid="hud-goal">
        <GoalRing value={progress.votedToday} goal={progress.dailyGoal} />
      </span>
      <span key={glows} className={cn("inline-flex items-center gap-1.5 px-0.5", glows > 0 && "animate-hud-glow")} data-testid="hud-link">
        <Sparkles className="size-5 text-xp" aria-hidden />
        <span key={`level-${progress.level}`} className="animate-pop-in whitespace-nowrap text-sm font-extrabold" data-testid="hud-level">
          Lv {progress.level}
        </span>
        <span className={cn("hidden whitespace-nowrap text-sm font-extrabold tabular-nums text-xp transition-transform sm:inline", xp.rising && "scale-110")} data-testid="hud-xp">
          {xp.shown} XP
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
