"use client";

import { Check } from "lucide-react";
import { XP_AMOUNTS } from "@/lib/civic/progress";
import { useCivicStore } from "@/stores/use-civic-store";

/** On a bill in a list: you've voted, or there's XP waiting. */
export function VoteStatusChip({ slug, initialPosition }: { slug: string; initialPosition: string | null }) {
  const stored = useCivicStore((state) => state.votes[slug]);
  const position = stored !== undefined ? stored : initialPosition;
  if (position === "YEA" || position === "NAY") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-support-tint px-2.5 py-0.5 text-xs font-extrabold text-support" data-testid="voted-chip">
        <Check className="size-3.5" aria-hidden />
        Voted
      </span>
    );
  }
  return (
    <span className="rounded-full bg-xp-tint px-2.5 py-0.5 text-xs font-extrabold" data-testid="xp-chip">
      +{XP_AMOUNTS.VOTE} XP
    </span>
  );
}
