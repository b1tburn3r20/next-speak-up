import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BillListItem } from "@/lib/civic/bills";
import { billLabel, BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BillStatusBadge({ status }: { status: string }) {
  const variant =
    status === "BECAME_LAW" || status === "SIGNED"
      ? "default"
      : status === "FAILED" || status === "VETOED"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{BILL_STATUS_LABELS[status as BillStatusValue] ?? status}</Badge>;
}

export function BillCard({ bill }: { bill: BillListItem }) {
  return (
    <Link
      href={`/bills/${bill.slug}`}
      className="block rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent/40"
      data-testid="bill-card"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{billLabel(bill.billType, bill.number)}</span>
        <BillStatusBadge status={bill.currentStatus} />
        {bill.policyArea ? (
          <span className="min-w-0 truncate text-muted-foreground">{bill.policyArea}</span>
        ) : null}
      </div>
      <p className="line-clamp-3 break-words font-medium">{bill.title}</p>
      {bill.latestActionText ? (
        <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
          {formatDate(bill.latestActionDate)}: {bill.latestActionText}
        </p>
      ) : null}
    </Link>
  );
}
