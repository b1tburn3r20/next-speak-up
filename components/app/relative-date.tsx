"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { fullDate, joinLabel, relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

const HOVER_DELAY_MS = 200;

/**
 * Shows a date the way people talk about it, like "Became law 2 months ago". Hovering shows the
 * exact date on a computer, and tapping shows it on a phone.
 */
export function RelativeDate({
  date,
  label,
  text: fixedText,
  detail,
  exactDate,
  className,
}: {
  date: Date | string;
  /** Goes before the time: "Became law", "Introduced". */
  label?: string;
  /** Replaces the words entirely, for when a countdown wouldn't be true. */
  text?: string;
  /** An extra sentence with the exact date, for when the date needs explaining. */
  detail?: string;
  /** Replaces the formatted date, for something like "Week of Monday, November 9, 2026". */
  exactDate?: string;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const value = typeof date === "string" ? new Date(date) : date;
  const exact = exactDate ?? fullDate(value);
  const text = fixedText ?? joinLabel(label, relativeTime(value, new Date()));

  // Touch screens have no hover, so a tap opens a dialog. On a computer, hovering already shows it.
  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (window.matchMedia("(hover: none)").matches) setDialogOpen(true);
  };

  return (
    <>
      <HoverCard openDelay={HOVER_DELAY_MS} closeDelay={100}>
        <HoverCardTrigger asChild>
          {/* Inline text in a sentence, which the Button component's layout would break. */}
          {/* eslint-disable-next-line no-restricted-syntax */}
          <button
            type="button"
            onClick={onClick}
            aria-label={`${text}. ${exact}`}
            data-testid="relative-date"
            className={cn(
              // Sits above a card's full-size link, so tapping it doesn't open the bill.
              "tap relative z-10 inline w-fit cursor-help rounded text-left font-semibold underline decoration-dotted decoration-1 underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary",
              className,
            )}
          >
            {/* The server and browser can briefly disagree if midnight passes in between. */}
            <span suppressHydrationWarning>{text}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto max-w-72" data-testid="relative-date-card">
          <p className="flex items-center gap-1.5 font-bold">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {exact}
          </p>
          {detail ? <p className="mt-1 text-muted-foreground">{detail}</p> : null}
        </HoverCardContent>
      </HoverCard>

      {dialogOpen ? (
        <Dialog open onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm" data-testid="relative-date-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                {exact}
              </DialogTitle>
              <DialogDescription>{detail ?? <span suppressHydrationWarning>{text}</span>}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
