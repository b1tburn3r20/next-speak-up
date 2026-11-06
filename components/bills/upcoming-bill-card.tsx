import Link from "next/link";
import { CalendarClock, FileText } from "lucide-react";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillStatusBadge, SponsorLine } from "@/components/bills/bill-card";
import { FloorWhen } from "@/components/bills/bill-when";
import { RelativeDate } from "@/components/app/relative-date";
import { Flex, OuterBlock, Stack } from "@/components/blocks";
import { PolicyChip } from "@/components/civic/policy-chip";
import { Term } from "@/components/civic/term";
import { buildDigest } from "@/lib/civic/digest";
import type { FloorItem } from "@/lib/civic/floor";
import { FLOOR_CATEGORY_LABELS, floorOutcome } from "@/lib/civic/floor-logic";
import { FLOOR_CATEGORY_TERMS } from "@/lib/civic/glossary";
import { billPath } from "@/lib/routes";

/** Why this bill gets a vote the way it does, with the jargon explained on tap. */
export function FloorCategoryPill({ category }: { category: string }) {
  const details = FLOOR_CATEGORY_LABELS[category] ?? FLOOR_CATEGORY_LABELS.OTHER;
  const term = FLOOR_CATEGORY_TERMS[category];
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs font-bold">
      {term ? <Term id={term}>{details.label}</Term> : details.label}
    </span>
  );
}

function Outcome({ item }: { item: FloorItem }) {
  const outcome = item.bill ? floorOutcome(item.bill.actions, item.weekOf) : null;
  if (!outcome) return null;
  const passed = outcome.kind === "PASSED";
  return (
    <p
      className={`rounded-lg px-2.5 py-1 text-sm font-extrabold ${passed ? "bg-support-tint text-support" : "bg-oppose-tint text-oppose"}`}
      data-testid="floor-outcome"
    >
      <RelativeDate
        date={outcome.date}
        label={passed ? "Passed the House" : "Failed in the House"}
        className="font-extrabold"
      />
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
  const now = new Date();
  const digest = buildDigest(bill?.summaries[0]?.text);
  return (
    <OuterBlock data-testid="floor-item">
      <Stack>
        <Flex gap="xs">
          <span className="mr-1 font-extrabold">{item.legislationRef}</span>
          {bill ? <BillStatusBadge status={bill.currentStatus} /> : null}
          <FloorCategoryPill category={item.category} />
        </Flex>
        {bill ? <PolicyChip name={bill.policyArea} link /> : null}
        <h3 className="break-words text-lg font-extrabold leading-snug">
          {bill ? (
            <Link href={billPath(bill.slug)} className="hover:underline">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        {digest ? (
          <p className="break-words leading-relaxed" data-testid="digest-lead">
            {digest.lead}
          </p>
        ) : bill ? (
          <p className="text-sm text-muted-foreground" data-testid="no-digest">
            No official summary yet.{" "}
            {item.documentUrl ? "The text going to the floor is linked below." : ""}
          </p>
        ) : null}
        {bill ? <SponsorLine bill={bill} /> : null}
        {item.bill && floorOutcome(item.bill.actions, item.weekOf) ? (
          <Outcome item={item} />
        ) : (
          <p className="flex items-center gap-1.5" data-testid="floor-when">
            <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
            <FloorWhen weekOf={item.weekOf} now={now} className="text-sm font-bold" />
          </p>
        )}
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
            className="tap inline-flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            <FileText className="size-4" aria-hidden />
            Text going to the floor
          </a>
        ) : null}
      </Stack>
    </OuterBlock>
  );
}
