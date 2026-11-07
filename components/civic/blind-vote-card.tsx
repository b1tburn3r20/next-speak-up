import Link from "next/link";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillStatusBadge, SponsorLine } from "@/components/bills/bill-card";
import { RelativeDate } from "@/components/app/relative-date";
import { OuterBlock, Stack } from "@/components/blocks";
import { AfterVote } from "@/components/civic/after-vote";
import { BillOutlookCard } from "@/components/civic/bill-outlook-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { RevealPanel } from "@/components/civic/reveal-panel";
import { MemberPhoto } from "@/components/people/member-photo";
import { buildDigest } from "@/lib/civic/digest";
import type { QueueItem } from "@/lib/civic/engage";
import { billLabel } from "@/lib/civic/labels";
import { billPath } from "@/lib/routes";

function repsSentence(reps: QueueItem["reps"]): string {
  const names = reps.map((rep) => rep.name);
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} voted on this`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} voted on this`;
}

/** A bill to weigh in on, before finding out how your reps voted. The core of the app. */
export function BlindVoteCard({
  item,
  signedIn,
  initialPosition = null,
}: {
  item: QueueItem;
  signedIn: boolean;
  initialPosition?: string | null;
}) {
  const { bill, reps, occurredAt } = item;
  const digest = buildDigest(bill.summaries[0]?.text);
  return (
    <OuterBlock data-testid="blind-vote-card" data-slug={bill.slug}>
      <Stack gap="md">
        {reps.length > 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-primary-tint p-2.5" data-testid="pulse-alert">
            <div className="flex shrink-0 -space-x-2">
              {reps.map((rep) => (
                <MemberPhoto key={rep.name} name={rep.name} url={rep.imageUrl} size={36} />
              ))}
            </div>
            <p className="min-w-0 text-sm font-bold leading-snug">
              {repsSentence(reps)}
              {occurredAt ? (
                <span className="block font-semibold text-muted-foreground"><RelativeDate date={occurredAt} label="Voted" /></span>
              ) : null}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-extrabold">{billLabel(bill.billType, bill.number)}</span>
          <PolicyChip name={bill.policyArea} link />
          {/* Where it stands waits until after the vote. */}
          <AfterVote slug={bill.slug} initialPosition={initialPosition}>
            <BillStatusBadge status={bill.currentStatus} />
          </AfterVote>
        </div>
        <h3 className="break-words text-lg font-extrabold leading-snug">
          <Link href={billPath(bill.slug)} className="hover:underline">
            {bill.title}
          </Link>
        </h3>
        {digest ? (
          <p className="text-base leading-relaxed" data-testid="digest-lead">
            {digest.lead}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="no-digest">
            The Congressional Research Service hasn&apos;t summarized this one yet, so the title is
            the best description we have.
          </p>
        )}
        <SponsorLine bill={bill} />
        <BillActionButtons
          slug={bill.slug}
          signedIn={signedIn}
          initialPosition={initialPosition}
          initialFollowing={false}
          showFollow={false}
          size="lg"
        />
        <AfterVote slug={bill.slug} initialPosition={initialPosition}>
          <BillOutlookCard status={bill.currentStatus} />
        </AfterVote>
        <RevealPanel slug={bill.slug} signedIn={signedIn} initialPosition={initialPosition} />
      </Stack>
    </OuterBlock>
  );
}
