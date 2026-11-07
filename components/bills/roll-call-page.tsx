import type { Metadata } from "next";
import { PageSpacer } from "@/components/blocks";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsOfNote, EmptyState, Panel } from "@/components/app/page-states";
import { formatDate } from "@/components/bills/bill-card";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { STATE_NAMES } from "@/lib/constants/state-names";
import { getRollCallDetail } from "@/lib/civic/bills";
import { billLabel, partyLabel, positionLabel } from "@/lib/civic/labels";
import { memberKeyOf } from "@/lib/civic/people";
import { billPath, memberPath } from "@/lib/routes";
import { Suspense } from "react";
import { RollCallSkeleton } from "@/components/app/skeletons";
import { rollCallExists } from "@/lib/civic/exists";

const STATE_OPTIONS = [
  { value: "", label: "Any state" },
  ...Object.entries(STATE_NAMES as Record<string, string>)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label })),
];

export type RollCallPageProps = {
  params: Promise<{ id: string; rollCallId: string }>;
  searchParams: Promise<{ party?: string; position?: string; state?: string }>;
};

export const rollCallMetadata: Metadata = { title: "How members voted" };

async function RollCallBody({ params, searchParams }: RollCallPageProps) {
  const { id, rollCallId } = await params;
  const filters = await searchParams;
  const numericId = Number(rollCallId);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();
  const detail = await getRollCallDetail(id, numericId, filters);
  if (!detail || !detail.rollCall.bill) notFound();
  const { rollCall, members } = detail;
  const bill = rollCall.bill!;
  const label = billLabel(bill.billType, bill.number);

  return (
    <PageSpacer>
      <header className="space-y-1">
        <nav className="text-sm">
          <Link href={billPath(bill.slug)} className="underline">
            Back to {label}
          </Link>
        </nav>
        <h1 className="break-words text-xl font-semibold">{rollCall.question ?? "Recorded vote"}</h1>
        <p className="text-sm text-muted-foreground">
          {rollCall.chamber.shortName}
          {rollCall.source === "IOWA_LEGISLATURE" ? " vote" : ` roll call ${rollCall.number}`}
          {rollCall.occurredAt ? `, ${formatDate(rollCall.occurredAt)}` : ""}
          {rollCall.result ? ` · ${rollCall.result}` : ""}
        </p>
        <p className="text-sm">
          {rollCall.totalYea} yes · {rollCall.totalNay} no · {rollCall.totalPresent} present ·{" "}
          {rollCall.totalNotVoting} not voting
        </p>
      </header>

      <form className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]" aria-label="Filter members">
        <OptionSelect
          name="position"
          defaultValue={filters.position ?? ""}
          aria-label="Vote"
          options={[
            { value: "", label: "Any vote" },
            { value: "YEA", label: "Yes" },
            { value: "NAY", label: "No" },
            { value: "PRESENT", label: "Present" },
            { value: "NOT_VOTING", label: "Not voting" },
          ]}
        />
        <OptionSelect
          name="party"
          defaultValue={filters.party ?? ""}
          aria-label="Party"
          options={[
            { value: "", label: "Any party" },
            { value: "D", label: "Democratic" },
            { value: "R", label: "Republican" },
            { value: "I", label: "Independent" },
          ]}
        />
        <OptionSelect
          name="state"
          defaultValue={filters.state ?? ""}
          aria-label="State"
          options={STATE_OPTIONS}
        />
        <Button type="submit">Filter</Button>
      </form>

      <Panel aria-label="Members">
        {members.length > 0 ? (
          <ul className="divide-y text-sm" data-testid="roll-call-members">
            {members.map((member) => {
              const bioguide = memberKeyOf(member.person);
              return (
                <li key={member.person.fullName} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0 break-words">
                    {bioguide ? (
                      <Link href={memberPath(bioguide)} className="underline">
                        {member.person.fullName}
                      </Link>
                    ) : (
                      member.person.fullName
                    )}{" "}
                    <span className="text-muted-foreground">
                      {partyLabel(member.party)}
                      {member.regionCode ? `, ${member.regionCode}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{positionLabel(member.position)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="No members match those filters" />
        )}
      </Panel>
      <AsOfNote date={rollCall.asOf} />
    </PageSpacer>
  );
}

export async function RollCallPage(props: RollCallPageProps) {
  const { id, rollCallId } = await props.params;
  const numericId = Number(rollCallId);
  if (!Number.isInteger(numericId) || numericId <= 0 || !(await rollCallExists(id, numericId))) notFound();
  return (
    <Suspense fallback={<RollCallSkeleton />}>
      <RollCallBody {...props} />
    </Suspense>
  );
}
