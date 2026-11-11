"use client";

import { useEffect, useState } from "react";
import { Award, Crown, Flame, Heart, Sparkles, Target, type LucideIcon } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { routes } from "@/lib/routes";
import { Progress } from "@/components/ui/progress";
import type { HudProgress } from "@/lib/civic/progress";
import { rankFor } from "@/lib/civic/ranks";
import { celebrationDetail, celebrationKind, type CelebrationKind } from "@/lib/civic/celebration";
import { cn } from "@/lib/utils";
import { useCivicStore, useProgress } from "@/stores/use-civic-store";

/**
 * Streak, level, and today's goal in one short row, each saying what its number is. Every tile goes to
 * Progress, where it's explained, except today's goal, which goes to voting, the way to meet it.
 */
export function ProgressStrip({ initial }: { initial: HudProgress }) {
  const progress = useProgress(initial);
  const { streak: liveStreak, level: liveLevel, xp: liveXp, votedToday: today, dailyGoal } = progress;
  const { next, xpToNext } = rankFor(liveXp);
  const goalPercent = Math.min(100, (today / dailyGoal) * 100);
  const tile = "flex min-w-0 items-center gap-2 rounded-xl p-2 transition-transform hover:-translate-y-0.5";
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="progress-strip">
      <Link href={routes.progress} className={`${tile} bg-streak-tint`} data-testid="strip-streak">
        <Flame className="size-5 shrink-0 text-streak" aria-hidden />
        <span className="min-w-0 leading-tight">
          <span className="block font-extrabold tabular-nums" data-testid="streak">
            {liveStreak}
          </span>
          <span className="block text-xs font-bold">day streak</span>
        </span>
      </Link>
      <Link href={routes.progress} className={`${tile} bg-xp-tint`} data-testid="strip-level" title={next ? `${xpToNext} XP to ${next.name}` : undefined}>
        <Sparkles className="size-5 shrink-0 text-xp" aria-hidden />
        <span className="min-w-0 leading-tight">
          <span className="block font-extrabold tabular-nums" data-testid="level">
            Level {liveLevel}
          </span>
          <span className="block text-xs font-bold tabular-nums">{liveXp} XP</span>
        </span>
      </Link>
      <Link href={routes.vote} className={`${tile} bg-primary-tint`} data-testid="strip-goal">
        <Target className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block font-extrabold tabular-nums" data-testid="daily-goal">
            {today >= dailyGoal ? "Goal met!" : `${today}/${dailyGoal}`}
          </span>
          <span className="block text-xs font-bold">votes today</span>
          <Progress value={goalPercent} aria-label="Today's goal" className="mt-1 h-1.5 bg-card" />
        </span>
      </Link>
    </div>
  );
}

// Where each spark ends up, in a ring around the +XP chip.
const SPARKS = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return { x: `${Math.round(Math.cos(angle) * 46)}px`, y: `${Math.round(Math.sin(angle) * 30)}px`, delay: `${(index % 3) * 40}ms` };
});

const KIND_STYLE: Record<CelebrationKind, { icon: LucideIcon; card: string; badge: string; ring: string; colors: string[] }> = {
  rank: { icon: Crown, card: "border-xp bg-xp-tint", badge: "bg-xp text-xp-foreground", ring: "border-xp", colors: ["--xp", "--streak", "--primary"] },
  level: { icon: Sparkles, card: "border-xp bg-xp-tint", badge: "bg-xp text-xp-foreground", ring: "border-xp", colors: ["--xp", "--primary"] },
  goal: { icon: Target, card: "border-support bg-support-tint", badge: "bg-support text-support-foreground", ring: "border-support", colors: ["--support", "--streak", "--primary"] },
  badge: { icon: Award, card: "border-streak bg-streak-tint", badge: "bg-streak text-streak-foreground", ring: "border-streak", colors: ["--streak", "--xp"] },
  thanks: { icon: Heart, card: "border-primary bg-primary-tint", badge: "bg-primary text-primary-foreground", ring: "border-primary", colors: ["--primary", "--support"] },
};

/** The theme's own colors, read from the page, so confetti matches light and dark. */
function themeColors(names: string[]): string[] {
  const style = getComputedStyle(document.documentElement);
  return names.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
}

/** Two bursts from the sides, in the celebration's colors. */
function fireConfetti(names: string[]) {
  const colors = themeColors(names);
  const shared = { particleCount: 55, spread: 65, startVelocity: 45, ticks: 220, colors, disableForReducedMotion: true } as const;
  confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.65 } });
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.65 } });
  // A smaller second wave, so it feels like a moment rather than a pop.
  setTimeout(() => confetti({ ...shared, particleCount: 35, spread: 100, startVelocity: 30, origin: { x: 0.5, y: 0.35 } }), 250);
}

// How long each celebration card stays, and the gap before the next one springs in.
const CARD_MS = 2600;
const GAP_MS = 250;
const CHIP_MS = 1200;
const NO_CELEBRATIONS: string[] = [];

/**
 * XP bursts out of its chip and flies up to the top bar, where the number counts up. Everything bigger
 * that the same vote earned, like a new rank and today's goal, gets its own card and confetti, one after
 * another, biggest first. A tap moves on to the next. Lives in the layout.
 */
export function RewardToast() {
  const reward = useCivicStore((state) => state.reward);
  const clear = useCivicStore((state) => state.clearReward);
  // Which reward is on screen, and which of its celebrations. -1 means only the +XP chip so far.
  const [showing, setShowing] = useState<{ id: number; step: number } | null>(null);
  const queue = reward?.celebrations ?? NO_CELEBRATIONS;

  // A new reward starts at the chip and its first card together.
  useEffect(() => {
    if (!reward) return;
    const start = setTimeout(() => setShowing({ id: reward.id, step: 0 }), 0);
    return () => clearTimeout(start);
  }, [reward]);

  const step = reward && showing?.id === reward.id ? showing.step : null;
  const current = step !== null && step < queue.length ? queue[step] : null;

  // Each step: confetti for its card, then on to the next card, or done.
  useEffect(() => {
    if (!reward || step === null) return;
    const done = step >= queue.length;
    if (!done && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fireConfetti(KIND_STYLE[celebrationKind(queue[step])].colors);
    }
    const next = setTimeout(
      () => {
        if (step + 1 < queue.length) setShowing({ id: reward.id, step: step + 1 });
        else {
          setShowing(null);
          clear();
        }
      },
      done ? CHIP_MS : CARD_MS + GAP_MS,
    );
    return () => clearTimeout(next);
  }, [reward, step, queue, clear]);

  if (!reward || step === null) return null;
  const kind = current ? celebrationKind(current) : null;
  const style = kind ? KIND_STYLE[kind] : null;
  const Icon = style?.icon ?? Sparkles;
  const skip = () => {
    if (step + 1 < queue.length) setShowing({ id: reward.id, step: step + 1 });
    else {
      setShowing(null);
      clear();
    }
  };
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-3 px-4">
      {/* The chip only flies with the first card. Later cards are the same vote's other news. */}
      {step === 0 ? (
        <span className="relative" data-testid="reward-burst">
          {SPARKS.map((spark, index) => (
            <span
              key={index}
              aria-hidden
              className="animate-spark absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-xp"
              style={{ "--spark-x": spark.x, "--spark-y": spark.y, animationDelay: spark.delay } as React.CSSProperties}
            />
          ))}
          <span className="animate-xp-fly relative inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-xp-tint bg-xp px-4 py-1.5 text-lg font-extrabold text-xp-foreground shadow-lg" data-testid="reward">
            <Sparkles className="size-4" aria-hidden />
            {reward.message}
          </span>
        </span>
      ) : null}
      {current && style && kind ? (
        // A button, so a tap moves on. It's the only thing here that takes the pointer.
        // eslint-disable-next-line no-restricted-syntax
        <button
          key={`${reward.id}-${step}`}
          type="button"
          onClick={skip}
          className={cn("animate-celebrate-in pointer-events-auto w-full max-w-xs rounded-3xl border-2 border-b-8 p-5 text-center shadow-xl", style.card)}
          data-testid="celebration"
          data-kind={kind}
        >
          <span className="relative mx-auto mb-2 flex size-16 items-center justify-center">
            <span aria-hidden className={cn("animate-ring-burst absolute inset-0 rounded-full border-4", style.ring)} />
            <span className={cn("animate-icon-bounce flex size-16 items-center justify-center rounded-full shadow-md", style.badge)}>
              <Icon className="size-8" aria-hidden />
            </span>
          </span>
          <span className="block text-xl font-extrabold leading-tight">{current}</span>
          <span className="mt-1 block text-sm font-semibold text-muted-foreground">{celebrationDetail(kind)}</span>
          {queue.length > 1 ? (
            <span className="mt-3 flex justify-center gap-1.5" aria-label={`${step + 1} of ${queue.length}`} data-testid="celebration-steps">
              {queue.map((item, index) => (
                <span key={item} className={cn("size-2 rounded-full", index === step ? style.badge.split(" ")[0] : "bg-foreground/15")} />
              ))}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
