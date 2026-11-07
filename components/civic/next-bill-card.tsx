import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PolicyChip } from "@/components/civic/policy-chip";
import { buttonVariants } from "@/components/ui/button";
import type { QueueItem } from "@/lib/civic/engage";
import { buildDigest } from "@/lib/civic/digest";
import { billLabel } from "@/lib/civic/labels";
import { billPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const REASON: Record<QueueItem["reason"], string> = {
  REP_VOTED: "Your rep voted on this. Did you agree?",
  FLOOR: "Coming up in the House",
  RECENT: "Your next bill",
};

/** The one bill to vote on next: what it's about, its name, and two lines on what it does. */
export function NextBillCard({ item }: { item: QueueItem }) {
  const { bill, reason } = item;
  const digest = buildDigest(bill.summaries[0]?.text);
  return (
    <div
      className="relative space-y-2 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4 sm:p-5"
      data-testid="next-bill"
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{REASON[reason]}</p>
      {bill.policyArea ? (
        <div className="relative z-10 w-fit">
          <PolicyChip name={bill.policyArea} link />
        </div>
      ) : null}
      <h2 className="break-words text-lg font-extrabold leading-snug sm:text-xl">
        <span className="text-muted-foreground">{billLabel(bill.billType, bill.number)}:</span>{" "}
        <Link href={billPath(bill.slug)} className="after:absolute after:inset-0 after:content-['']">
          {bill.title}
        </Link>
      </h2>
      {digest ? (
        <p className="line-clamp-2 break-words" data-testid="next-bill-summary">
          {digest.lead}
        </p>
      ) : null}
      <span className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
        Vote on this bill
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </div>
  );
}
