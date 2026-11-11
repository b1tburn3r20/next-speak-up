"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// A computer with a mouse gets a popover beside what was clicked. A phone or tablet gets a dialog,
// because a popover there is cramped and easy to dismiss by accident.
const POPOVER_QUERY = "(min-width: 768px) and (hover: hover)";

/**
 * Something to tap that opens more about it: a popover on a computer, a dialog on a phone. Which one is
 * decided when it's opened, so the server's HTML is the same for everyone. The content mounts only
 * while it's open, so it can load what it needs then.
 */
export function DialogPopover({
  trigger,
  title,
  description,
  children,
  label,
  className,
  contentClassName,
  testId,
  inline = false,
}: {
  /** What's shown, inside the button that opens it. */
  trigger: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** The button's name for screen readers, when the trigger alone doesn't say what it opens. */
  label?: string;
  className?: string;
  contentClassName?: string;
  testId?: string;
  /** A trigger inside a sentence, like a word, instead of a block that fills its row. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [asPopover, setAsPopover] = useState(false);
  const show = () => {
    setAsPopover(window.matchMedia(POPOVER_QUERY).matches);
    setOpen(true);
  };
  const header = (
    <>
      <p className="font-extrabold leading-snug">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </>
  );

  return (
    <>
      <Popover open={open && asPopover} onOpenChange={(next) => !next && setOpen(false)}>
        <PopoverAnchor asChild>
          <button
            type="button"
            onClick={show}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={label}
            className={cn(
              "cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-ring",
              inline ? "inline rounded-sm" : "block w-full rounded-xl transition-colors hover:bg-muted",
              className,
            )}
            data-testid={testId}
          >
            {trigger}
          </button>
        </PopoverAnchor>
        {/* Never taller than the room the screen has, so the title stays in view and the list scrolls. */}
        <PopoverContent
          align="start"
          side="bottom"
          collisionPadding={16}
          className={cn("flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-96 max-w-[calc(100vw-2rem)] flex-col gap-0 p-0", contentClassName)}
          data-testid={testId ? `${testId}-panel` : undefined}
        >
          <div className="shrink-0 border-b-2 px-4 pb-2 pt-3">{header}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">{open && asPopover ? children : null}</div>
        </PopoverContent>
      </Popover>
      <Dialog open={open && !asPopover} onOpenChange={setOpen}>
        <DialogContent
          className={cn("max-h-[85dvh] gap-3 overflow-hidden p-0", contentClassName)}
          data-testid={testId ? `${testId}-panel` : undefined}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <DialogHeader className="border-b-2 px-5 pb-3 pt-5 text-left">
            <DialogTitle className="pr-8">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[65dvh] overflow-y-auto px-5 pb-5">{open && !asPopover ? children : null}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
