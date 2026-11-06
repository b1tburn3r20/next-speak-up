import Link from "next/link";
import { PolicyChip } from "@/components/civic/policy-chip";
import { MemberPhoto } from "@/components/people/member-photo";
import { OuterBlock } from "@/components/blocks";
import type { BillListItem } from "@/lib/civic/bills";
import { buildDigest } from "@/lib/civic/digest";
import { billLabel, BILL_STATUS_LABELS, partyLabel, type BillStatusValue } from "@/lib/civic/labels";
import { cn } from "@/lib/utils";
import { billPath } from "@/lib/routes";
import { BillWhen } from "@/components/bills/bill-when";

export function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_STYLE: Partial<Record<BillStatusValue, string>> = {
  BECAME_LAW: "bg-support-tint text-support",
  SIGNED: "bg-support-tint text-support",
  VETO_OVERRIDDEN: "bg-support-tint text-support",
  FAILED: "bg-oppose-tint text-oppose",
  VETOED: "bg-oppose-tint text-oppose",
  PASSED_BOTH_CHAMBERS: "bg-primary-tint text-primary-edge",
  PASSED_ORIGIN_CHAMBER: "bg-primary-tint text-primary-edge",
  TO_EXECUTIVE: "bg-primary-tint text-primary-edge",
  AGREED_TO: "bg-primary-tint text-primary-edge",
};

export function BillStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
        STATUS_STYLE[status as BillStatusValue] ?? "bg-muted text-muted-foreground",
      )}
      data-testid="bill-status"
    >
      {BILL_STATUS_LABELS[status as BillStatusValue] ?? status}
    </span>
  );
}

/** Who's behind a bill: their face, name, party, and how many others signed on. */
export function SponsorLine({ bill }: { bill: BillListItem }) {
  const sponsor = bill.sponsorships[0]?.person;
  const term = sponsor?.terms[0];
  const cosponsors = bill._count.sponsorships;
  if (!sponsor) {
    return <p className="text-sm text-muted-foreground">Sponsor not listed yet</p>;
  }
  return (
    <div className="flex items-center gap-2 text-sm" data-testid="sponsor-line">
      <MemberPhoto name={sponsor.fullName} url={sponsor.imageUrl} party={term?.party} size={28} />
      <p className="min-w-0 leading-snug">
        <span className="font-bold">{sponsor.fullName}</span>
        <span className="text-muted-foreground">
          {term ? ` (${partyLabel(term.party)}, ${term.regionCode})` : ""}
          {cosponsors > 0 ? ` and ${cosponsors} cosponsor${cosponsors === 1 ? "" : "s"}` : ""}
        </span>
      </p>
    </div>
  );
}

export function BillCard({ bill }: { bill: BillListItem }) {
  const digest = buildDigest(bill.summaries[0]?.text);
  return (
    <OuterBlock className="relative transition-colors hover:border-primary/60" data-testid="bill-card">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="font-extrabold">{billLabel(bill.billType, bill.number)}</span>
        <BillStatusBadge status={bill.currentStatus} />
        {bill.policyArea ? <PolicyChip name={bill.policyArea} /> : null}
      </div>
      <h3 className="mb-1 line-clamp-3 break-words font-bold leading-snug">
        {/* The whole card is clickable, with the title as the real link. */}
        <Link href={billPath(bill.slug)} className="after:absolute after:inset-0 after:content-['']">
          {bill.title}
        </Link>
      </h3>
      {digest ? (
        <p className="mb-2 line-clamp-3 break-words text-sm text-muted-foreground">{digest.lead}</p>
      ) : bill.latestActionText ? (
        <p className="mb-2 line-clamp-2 break-words text-sm text-muted-foreground">
          {bill.latestActionText}
        </p>
      ) : null}
      <SponsorLine bill={bill} />
      <p className="mt-2">
        <BillWhen bill={bill} />
      </p>
    </OuterBlock>
  );
}
