"use client";

import { useCivicStore } from "@/stores/use-civic-store";

/** Shows what's inside only once someone has voted on this bill. */
export function AfterVote({
  slug,
  initialPosition = null,
  children,
}: {
  slug: string;
  initialPosition?: string | null;
  children: React.ReactNode;
}) {
  const stored = useCivicStore((state) => state.votes[slug]);
  const position = stored !== undefined ? stored : initialPosition;
  return position === "YEA" || position === "NAY" ? <>{children}</> : null;
}
