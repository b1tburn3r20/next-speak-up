"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { AlignmentRing } from "@/components/civic/charts";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { positionLabel } from "@/lib/civic/labels";
import { pulseHeadline, summarizePulse, type PulseSummary, type PulseVote } from "@/lib/civic/pulse-check";
import type { VerdictTone } from "@/lib/civic/verdict";
import { billPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useCivicStore } from "@/stores/use-civic-store";

function toneOf(percent: number | null): VerdictTone {
  if (percent === null) return "unknown";
  if (percent >= 70) return "good";
  if (percent >= 40) return "mixed";
  return "bad";
}

const SAVE_WAIT_MS = 700;
const TRIES = 4;

/**
 * The end of a pulse check: how you lined up with one member on just these bills. Their votes are asked
 * for only now, after yours, and only for the bills you voted on.
 */
export function PulseCheckFinish({
  personId,
  firstName,
  slugs,
  memberHref,
  againHref,
}: {
  personId: number;
  firstName: string;
  slugs: string[];
  memberHref: string;
  againHref: string;
}) {
  const votes = useCivicStore((state) => state.votes);
  const votedHere = slugs.filter((slug) => votes[slug] === "YEA" || votes[slug] === "NAY").length;
  const [summary, setSummary] = useState<PulseSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (tries: number) => {
      try {
        const response = await fetch(`/api/civic/people/pulse-check?personId=${personId}&slugs=${encodeURIComponent(slugs.join(","))}`);
        if (!response.ok) throw new Error("failed");
        const { votes: rows } = (await response.json()) as { votes: PulseVote[] };
        // The last vote may still be saving. Ask again for a moment, rather than leave it out.
        if (rows.length < votedHere && tries > 1) {
          setTimeout(() => !cancelled && load(tries - 1), SAVE_WAIT_MS);
          return;
        }
        if (!cancelled) setSummary(summarizePulse(rows));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    load(TRIES);
    return () => {
      cancelled = true;
    };
  }, [personId, slugs, votedHere]);

  if (failed) {
    return (
      <div className="space-y-3 rounded-2xl border-2 border-b-4 bg-card p-6 text-center" data-testid="pulse-finish">
        <p className="font-extrabold">We couldn&apos;t load how they voted just now.</p>
        <Link href={memberHref} className={buttonVariants({ size: "lg" })}>
          See {firstName}&apos;s page
        </Link>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-3 rounded-2xl border-2 border-b-4 bg-card p-6" data-testid="pulse-finish-skeleton" aria-hidden>
        <Skeleton className="mx-auto size-24 rounded-full" />
        <Skeleton className="mx-auto h-6 w-2/3" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pop-in space-y-5 rounded-2xl border-2 border-b-4 bg-card p-5 sm:p-6" data-testid="pulse-finish">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlignmentRing percent={summary.percent} tone={toneOf(summary.percent)} size={104} />
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold" data-testid="pulse-headline">
            {pulseHeadline(firstName, summary)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Just this pulse check. Your full match with {firstName} counts every bill you&apos;ve both voted on.
          </p>
        </div>
      </div>

      {summary.rows.length > 0 ? (
        <ul className="divide-y-2 rounded-xl border-2" data-testid="pulse-rows">
          {summary.rows.map((row) => {
            const match = row.outcome === "MATCH";
            const differ = row.outcome === "DIFFERENT";
            return (
              <li key={row.slug} className="flex items-start gap-3 p-3" data-testid="pulse-row" data-outcome={row.outcome}>
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    match ? "bg-support-tint text-support" : differ ? "bg-oppose-tint text-oppose" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {match ? <Check className="size-4" /> : differ ? <X className="size-4" /> : "–"}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={billPath(row.slug)} className="line-clamp-2 break-words font-extrabold hover:underline">
                    {row.label}: {row.title}
                  </Link>
                  <span className="block text-sm text-muted-foreground">
                    You: {positionLabel(row.you)} · {firstName}: {row.them ? positionLabel(row.them) : "No record"}
                    {match ? " · You agree" : differ ? " · You differ" : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href={againHref} className={buttonVariants({ size: "lg" })} data-testid="pulse-again">
          Do another pulse check
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href={memberHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to {firstName}
        </Link>
      </div>
    </div>
  );
}
