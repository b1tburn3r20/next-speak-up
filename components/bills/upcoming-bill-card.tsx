import Link from "next/link";
import { FileText } from "lucide-react";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import type { FloorItem } from "@/lib/civic/floor";
import { FLOOR_CATEGORY_LABELS, floorOutcome } from "@/lib/civic/floor-logic";

export function FloorCategoryPill({ category }: { category: string }) {
  const details = FLOOR_CATEGORY_LABELS[category] ?? FLOOR_CATEGORY_LABELS.OTHER;
  return (
    <span title={details.hint} className="rounded-full border px-2 py-0.5 text-xs">
      {details.label}
    </span>
  );
}

function Outcome({ item }: { item: FloorItem }) {
  const outcome = item.bill ? floorOutcome(item.bill.actions, item.weekOf) : null;
  if (!outcome) return null;
  return (
    <p className="text-sm font-medium" data-testid="floor-outcome">
      {outcome.kind === "PASSED" ? "Passed the House" : "Failed in the House"},{" "}
      {formatDate(outcome.date)}
    </p>
  );
}

export function UpcomingBillCard({
  item,
  signedIn,
  state,
}: {
  item: FloorItem;
  signedIn: boolean;
  state?: { position: string | null; following: boolean };
}) {
  const bill = item.bill;
  return (
    <article
      className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
      data-testid="floor-item"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{item.legislationRef}</span>
        <FloorCategoryPill category={item.category} />
        {bill ? <BillStatusBadge status={bill.currentStatus} /> : null}
        {bill?.policyArea ? (
          <span className="text-xs text-muted-foreground">{bill.policyArea}</span>
        ) : null}
      </div>
      <h3 className="break-words font-medium">
        {bill ? (
          <Link href={`/bills/${bill.slug}`} className="underline-offset-2 hover:underline">
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </h3>
      <Outcome item={item} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {bill ? (
          <BillActionButtons
            slug={bill.slug}
            signedIn={signedIn}
            initialPosition={state?.position ?? null}
            initialFollowing={state?.following ?? false}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            We don&apos;t have this bill&apos;s details yet.
          </p>
        )}
        {item.documentUrl ? (
          <a
            href={item.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm underline"
          >
            <FileText className="size-4" aria-hidden />
            Text going to the floor
          </a>
        ) : null}
      </div>
    </article>
  );
}
