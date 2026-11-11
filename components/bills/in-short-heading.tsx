"use client";

import { Info, ScrollText } from "lucide-react";
import { DialogPopover } from "@/components/ui/dialog-popover";

/**
 * The "In short" heading, which opens where those words come from. They're the opening of the
 * official summary, word for word, so the heading says so on a tap instead of in another line of text.
 */
export function InShortHeading({ source }: { source: "CRS" | "BILL_EXPLANATION" }) {
  const fromBill = source === "BILL_EXPLANATION";
  return (
    <h2 id="digest-heading" className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
      <DialogPopover
        inline
        trigger={
          <span className="inline-flex items-center gap-1.5">
            <ScrollText className="size-4 text-primary" aria-hidden />
            In short
            <Info className="size-3.5" aria-hidden />
          </span>
        }
        label="In short: where these words come from"
        title="Where “In short” comes from"
        className="px-1 py-0.5 uppercase hover:bg-muted"
        contentClassName="w-80"
        testId="in-short"
      >
        <div className="space-y-2 py-2 text-sm normal-case tracking-normal" data-testid="in-short-explanation">
          <p>
            {fromBill
              ? "It's the first sentence or two of the explanation the bill's authors wrote at the end of the bill, word for word."
              : "It's the first sentence or two of the official summary, word for word. The Congressional Research Service writes those summaries. It's Congress's own research staff, and it doesn't take sides."}
          </p>
          <p>We don&apos;t reword it, and no AI writes it, so it can&apos;t change what the bill does.</p>
          <p className="text-muted-foreground">{fromBill ? "The whole explanation" : "The whole summary"} is in the tab below the vote.</p>
        </div>
      </DialogPopover>
    </h2>
  );
}
