"use client";

import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCivicStore } from "@/stores/use-civic-store";

/** The alert in the navigation: how many of your reps' votes you haven't weighed in on. */
export function PulseDot({ className }: { className?: string }) {
  const count = useCivicStore((state) => state.pulseCount);
  const load = useCivicStore((state) => state.loadPulseCount);

  useEffect(() => {
    load();
  }, [load]);

  // Still loading: the shape of the number, so nothing jumps when it arrives.
  if (count === null) return <Skeleton className="h-5 w-5 rounded-full" data-testid="pulse-skeleton" />;
  if (!count) return null;
  return (
    <span
      className={`animate-pop-in inline-flex min-w-5 items-center justify-center rounded-full bg-oppose px-1 text-[0.65rem] font-extrabold leading-5 text-oppose-foreground ${className ?? ""}`}
      data-testid="pulse-dot"
      aria-label={`${count} of your reps' votes to weigh in on`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
