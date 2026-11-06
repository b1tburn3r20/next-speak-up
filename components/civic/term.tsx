"use client";

import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { glossaryEntry } from "@/lib/civic/glossary";

/** Jargon that explains itself on tap. An unknown term just shows as text. */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const entry = glossaryEntry(id);
  if (!entry) return <>{children}</>;
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        data-testid={`term-${id}`}
        className="tap cursor-help rounded-sm border-b-2 border-dotted border-primary/60 font-inherit text-left hover:bg-primary-tint"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[85vw] space-y-1 text-sm" data-testid="term-explanation">
        <p className="font-extrabold">{entry.term}</p>
        <p>{entry.short}</p>
        <Link href="/learn" className="text-xs font-bold text-primary hover:underline">
          More plain-English terms
        </Link>
      </PopoverContent>
    </Popover>
  );
}
