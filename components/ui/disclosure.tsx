"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Show more, in place. `aside` sits beside the button rather than in it, because a button can't
 * hold another control, like a glossary term.
 */
export function Disclosure({
  title,
  aside,
  defaultOpen = false,
  className,
  children,
  "data-testid": testId,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} data-testid={testId} className={cn("group/disclosure", className)}>
      <div className="flex flex-wrap items-center gap-x-3">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="link"
            data-testid={testId ? `${testId}-trigger` : undefined}
            className="h-auto min-h-11 justify-start gap-1.5 px-0 text-left text-base whitespace-normal"
          >
            <ChevronDown
              className="size-5 transition-transform group-data-[state=open]/disclosure:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
            {title}
          </Button>
        </CollapsibleTrigger>
        {aside ? <span className="text-sm">{aside}</span> : null}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
