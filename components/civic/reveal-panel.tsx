"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, Eye, HelpCircle, Loader2, Minus, X } from "lucide-react";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { MemberPhoto } from "@/components/people/member-photo";
import { Button } from "@/components/ui/button";
import { partyLabel, positionLabel } from "@/lib/civic/labels";
import { revealOutcome } from "@/lib/civic/verdict";
import { cn } from "@/lib/utils";
import { useCivicStore, type RepReveal } from "@/stores/use-civic-store";
import { memberPath } from "@/lib/routes";

const OUTCOME = {
  MATCH: { label: "You match", icon: Check, className: "bg-support-tint text-support" },
  DIFFERENT: { label: "You differ", icon: X, className: "bg-oppose-tint text-oppose" },
  DID_NOT_VOTE: { label: "Didn't vote", icon: Minus, className: "bg-card text-muted-foreground" },
  NO_RECORD: { label: "No vote yet", icon: HelpCircle, className: "bg-card text-muted-foreground" },
};

function positionText(position: RepReveal["position"]): string {
  if (position === null) return "No recorded vote on this bill.";
  if (position === "NOT_VOTING") return "Didn't vote.";
  return `Voted ${positionLabel(position).toLowerCase()}.`;
}

function RevealRow({ rep, userChoice }: { rep: RepReveal; userChoice: string | null }) {
  const userVoted = userChoice === "YEA" || userChoice === "NAY";
  // Worked out here from the current vote, so changing your mind updates it right away.
  const outcomeKey = revealOutcome(userChoice, rep.position);
  const outcome = userVoted || rep.position === null ? OUTCOME[outcomeKey] : null;
  const Icon = outcome?.icon;
  return (
    <li
      className="animate-rise-in flex items-center gap-3"
      data-testid="reveal-row"
      data-outcome={userVoted ? outcomeKey : "UNVOTED"}
    >
      <MemberPhoto name={rep.name} url={rep.imageUrl} party={rep.party} size={48} />
      <div className="min-w-0 flex-1">
        <p className="break-words font-bold leading-snug">
          {rep.bioguide ? (
            <Link href={memberPath(rep.bioguide)} className="hover:underline">
              {rep.name}
            </Link>
          ) : (
            rep.name
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {rep.role}, {partyLabel(rep.party)}. {positionText(rep.position)}
        </p>
      </div>
      {outcome && Icon ? (
        <span
          className={cn(
            "animate-pop-in inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold",
            outcome.className,
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {outcome.label}
        </span>
      ) : null}
    </li>
  );
}

/**
 * The moment of truth. How a rep voted isn't in the page: it's fetched here once the user votes, or
 * asks to see it anyway. `initialPosition` is their vote when the page loaded.
 */
export function RevealPanel({
  slug,
  signedIn,
  initialPosition,
}: {
  slug: string;
  signedIn: boolean;
  initialPosition: string | null;
}) {
  const stored = useCivicStore((state) => state.votes[slug]);
  const reveal = useCivicStore((state) => state.reveals[slug]);
  const loadReveal = useCivicStore((state) => state.loadReveal);
  const clearReveal = useCivicStore((state) => state.clearReveal);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const position = stored !== undefined ? stored : initialPosition;
  const userVoted = position === "YEA" || position === "NAY";
  const hadVote = useRef(userVoted);

  useEffect(() => {
    if (!signedIn) return;
    if (userVoted) loadReveal(slug);
    // Taking a vote back goes back to not knowing.
    else if (hadVote.current) clearReveal(slug);
    hadVote.current = userVoted;
  }, [signedIn, userVoted, slug, loadReveal, clearReveal]);

  if (!reveal) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted p-3"
        data-testid="reveal-hidden"
      >
        <p className="text-sm font-bold">
          {signedIn ? "How did your reps vote? Vote to find out." : "Sign in and vote to see how your reps voted."}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => (signedIn ? loadReveal(slug) : openLogin(true))}
          data-testid="reveal-anyway"
        >
          <Eye className="size-4" aria-hidden />
          Show me anyway
        </Button>
      </div>
    );
  }
  if (reveal.status === "loading") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm font-bold" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking how your reps voted
      </p>
    );
  }
  if (reveal.status === "error") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-oppose-tint p-3" role="alert">
        <p className="text-sm font-bold">{reveal.message}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => loadReveal(slug)}>
          Try again
        </Button>
      </div>
    );
  }
  if (reveal.reps.length === 0) {
    return (
      <div className="rounded-xl bg-muted p-3 text-sm" data-testid="reveal-no-reps">
        <p className="font-bold">We don&apos;t know who your reps are yet.</p>
        <Link href="/reps" className="font-bold text-primary hover:underline">
          Find your reps to compare
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-xl bg-muted p-3" data-testid="reveal-panel">
      <p className="font-extrabold">{userVoted ? "Here's how you compare" : "How your reps voted"}</p>
      <ul className="space-y-3">
        {reveal.reps.map((rep) => (
          <RevealRow key={rep.personId} rep={rep} userChoice={position} />
        ))}
      </ul>
    </div>
  );
}
