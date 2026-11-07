"use client";

import { useEffect, useRef } from "react";
import { useCivicStore } from "@/stores/use-civic-store";

/** After voting from the gate, brings the result into view. It's what you came for. */
export function VoteResultAnchor({ slug }: { slug: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const justVoted = useCivicStore((state) => state.justVoted);
  const clear = useCivicStore((state) => state.setJustVoted);

  useEffect(() => {
    if (justVoted !== slug) return;
    clear(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [justVoted, slug, clear]);

  return <span ref={ref} className="block scroll-mt-4" aria-hidden />;
}
