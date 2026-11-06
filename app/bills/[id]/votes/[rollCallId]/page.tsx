import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsOfNote, EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { formatDate } from "@/components/bills/bill-card";
import { Button } from "@/components/ui/button";
import { getRollCallDetail } from "@/lib/civic/bills";
import { billLabel, partyLabel, positionLabel } from "@/lib/civic/labels";
import { bioguideOf } from "@/lib/civic/people";

type PageProps = {
  params: Promise<{ id: string; rollCallId: string }>;
  searchParams: Promise<{ party?: string; position?: string; state?: string }>;
};

export const metadata: Metadata = { title: "How members voted" };

const SELECT_CLASS = "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm";

export default async function RollCallPage({ params, searchParams }: PageProps) {
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
    <PageContainer>
      <header className="space-y-1">
        <nav className="text-sm">
          <Link href={`/bills/${bill.slug}`} className="underline">
            Back to {label}
          </Link>
        </nav>
        <h1 className="break-words text-xl font-semibold">{rollCall.question ?? "Recorded vote"}</h1>
        <p className="text-sm text-muted-foreground">
          {rollCall.chamber.shortName} roll call {rollCall.number}
          {rollCall.occurredAt ? `, ${formatDate(rollCall.occurredAt)}` : ""}
          {rollCall.result ? ` · ${rollCall.result}` : ""}
        </p>
        <p className="text-sm">
          {rollCall.totalYea} yes · {rollCall.totalNay} no · {rollCall.totalPresent} present ·{" "}
          {rollCall.totalNotVoting} not voting
        </p>
      </header>

      <form className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]" aria-label="Filter members">
        <select name="position" defaultValue={filters.position ?? ""} aria-label="Vote" className={SELECT_CLASS}>
          <option value="">Any vote</option>
          <option value="YEA">Yes</option>
          <option value="NAY">No</option>
          <option value="PRESENT">Present</option>
          <option value="NOT_VOTING">Not voting</option>
        </select>
        <select name="party" defaultValue={filters.party ?? ""} aria-label="Party" className={SELECT_CLASS}>
          <option value="">Any party</option>
          <option value="D">Democratic</option>
          <option value="R">Republican</option>
          <option value="I">Independent</option>
        </select>
        <input
          name="state"
          defaultValue={filters.state ?? ""}
          maxLength={2}
          placeholder="State, like TX"
          aria-label="State"
          className={`${SELECT_CLASS} uppercase placeholder:normal-case`}
        />
        <Button type="submit">Filter</Button>
      </form>

      <Panel aria-label="Members">
        {members.length > 0 ? (
          <ul className="divide-y text-sm" data-testid="roll-call-members">
            {members.map((member) => {
              const bioguide = bioguideOf(member.person);
              return (
                <li key={member.person.fullName} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0 break-words">
                    {bioguide ? (
                      <Link href={`/legislators/federal/${bioguide}`} className="underline">
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
    </PageContainer>
  );
}
