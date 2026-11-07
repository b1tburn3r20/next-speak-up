import Link from "next/link";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Quest } from "@/lib/civic/engagement-logic";

/** Today's three things to do. Each is checked against what really happened. */
export function QuestsCard({ quests, streakWaiting }: { quests: Quest[]; streakWaiting: number }) {
  return (
    <div className="rounded-2xl border-2 border-b-4 bg-card p-4" data-testid="quests">
      <h2 className="text-lg font-extrabold">Today&apos;s quests</h2>
      {streakWaiting > 0 ? (
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-streak-tint p-2 text-sm font-bold" data-testid="streak-nudge">
          <Flame className="size-5 shrink-0 text-streak" aria-hidden />
          Vote today to keep your {streakWaiting}-day streak
        </p>
      ) : null}
      <ul className="mt-2 space-y-2">
        {quests.map((quest) => (
          <li key={quest.id} data-testid="quest" data-done={quest.done}>
            <Link href={quest.href} className="block rounded-xl p-1.5 hover:bg-muted">
              <span className="flex items-start gap-2">
                {quest.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-support" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="min-w-0 flex-1 text-sm font-bold leading-snug">
                  {quest.title}
                  {quest.done ? <span className="sr-only"> (done)</span> : null}
                  {quest.bonusXp ? (
                    <span className="ml-1 whitespace-nowrap rounded-full bg-xp-tint px-1.5 text-xs font-extrabold">+{quest.bonusXp} XP</span>
                  ) : null}
                </span>
              </span>
              {quest.goal > 1 ? (
                <span className="mt-1 flex items-center gap-2 pl-7">
                  <Progress value={quest.current} max={quest.goal} aria-label={quest.title} className="h-2.5" />
                  <span className="text-xs font-extrabold tabular-nums">
                    {quest.current}/{quest.goal}
                  </span>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
