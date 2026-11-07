"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, PartyPopper, SkipForward, X } from "lucide-react";
import { PolicyLeanChart } from "@/components/civic/policy-lean-chart";
import type { PolicyLean } from "@/lib/civic/engagement-logic";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCivicStore } from "@/stores/use-civic-store";
import { routes } from "@/lib/routes";

export function SessionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" aria-label="Leave this session" className="text-muted-foreground hover:text-foreground">
        <X className="size-6" aria-hidden />
      </Link>
      <Progress
        className="flex-1"
        value={current}
        max={total}
        aria-label={`${current} of ${total} done`}
        data-testid="session-progress"
      />
      <span className="text-sm font-extrabold tabular-nums">
        {current}/{total}
      </span>
    </div>
  );
}

function SessionFinish({ slugs, signedIn, startXp }: { slugs: string[]; signedIn: boolean; startXp: number | null }) {
  const votes = useCivicStore((state) => state.votes);
  const reveals = useCivicStore((state) => state.reveals);
  const progress = useCivicStore((state) => state.progress);
  const [areas, setAreas] = useState<PolicyLean[] | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/civic/policy-lean")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setAreas(data?.areas ?? null))
      .catch(() => undefined);
  }, [signedIn]);

  const voted = slugs.filter((slug) => votes[slug] === "YEA" || votes[slug] === "NAY");
  let matched = 0;
  let compared = 0;
  for (const slug of voted) {
    const reveal = reveals[slug];
    if (reveal?.status !== "ready") continue;
    for (const rep of reveal.reps) {
      if (rep.position === "YEA" || rep.position === "NAY") {
        compared += 1;
        if (rep.position === votes[slug]) matched += 1;
      }
    }
  }
  const earned = progress && startXp !== null ? Math.max(0, progress.xp - startXp) : 0;
  return (
    <div className="animate-pop-in space-y-4 rounded-2xl border-2 border-b-4 border-support bg-support-tint p-6 text-center" data-testid="session-finish">
      <PartyPopper className="mx-auto size-12 text-support" aria-hidden />
      <div>
        <h2 className="text-2xl font-extrabold">Nice work!</h2>
        <p data-testid="session-summary">
          {voted.length === 0
            ? "You didn't vote on any of these. There's always more when you're ready."
            : `You weighed in on ${voted.length} bill${voted.length === 1 ? "" : "s"}.`}
          {compared > 0 ? ` Your reps matched you on ${matched} of ${compared} votes.` : ""}
        </p>
      </div>
      {earned > 0 ? (
        <p className="animate-pop-in text-2xl font-extrabold text-xp" data-testid="session-xp">
          +{earned} XP
        </p>
      ) : null}
      {progress && areas ? (
        <div className="rounded-xl bg-card p-3 text-left">
          <p className="mb-2 font-extrabold">How you vote, by topic</p>
          <PolicyLeanChart userId={progress.userId} areas={areas} />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/vote"
          className={cn(buttonVariants({ variant: "default", size: "lg" }))}
          data-testid="session-again"
        >
          Keep going
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href={signedIn ? "/reps" : routes.federal.upcoming}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          {signedIn ? "See your reps' report cards" : "See upcoming votes"}
        </Link>
      </div>
    </div>
  );
}

/**
 * One bill at a time, like a lesson. The cards are rendered on the server and passed in, so this
 * only holds where you are. It mounts just the current one, which keeps the rest out of the DOM.
 */
export function VoteSession({
  slugs,
  cards,
  signedIn,
}: {
  slugs: string[];
  cards: React.ReactNode[];
  signedIn: boolean;
}) {
  const [index, setIndex] = useState(0);
  // Bills in a row you've voted on. Skipping starts it over, without any penalty.
  const [combo, setCombo] = useState(0);
  const [startXp] = useState(() => useCivicStore.getState().progress?.xp ?? null);
  const slug = slugs[index];
  const vote = useCivicStore((state) => (slug ? state.votes[slug] : undefined));
  const answered = vote === "YEA" || vote === "NAY";
  const finished = index >= slugs.length;

  return (
    <div className="space-y-4" data-testid="vote-session">
      <SessionProgress current={Math.min(index, slugs.length)} total={slugs.length} />
      {combo >= 2 && !finished ? (
        <p key={combo} className="animate-pop-in flex items-center justify-center gap-1 font-extrabold" data-testid="session-combo">
          <Flame className="size-5 text-streak" aria-hidden />
          {combo} in a row
        </p>
      ) : null}
      {finished ? (
        <SessionFinish slugs={slugs} signedIn={signedIn} startXp={startXp} />
      ) : (
        <>
          <div key={slug} className="animate-rise-in">
            {cards[index]}
          </div>
          <div className="flex gap-2">
            {answered ? (
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  setCombo(combo + 1);
                  setIndex(index + 1);
                }}
                data-testid="session-next"
              >
                {index + 1 === slugs.length ? "Finish" : "Next bill"}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCombo(0);
                  setIndex(index + 1);
                }}
                data-testid="session-skip"
              >
                <SkipForward className="size-4" aria-hidden />
                Skip this one
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
