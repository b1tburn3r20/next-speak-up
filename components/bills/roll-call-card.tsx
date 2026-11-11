import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { partyLabel, positionLabel } from "@/lib/civic/labels";
import type { PartyBreakdown } from "@/lib/civic/bills";
import { AsOfNote } from "@/components/app/page-states";
import { formatDate } from "./bill-card";
import { RelativeDate } from "@/components/app/relative-date";

export type RollCallCardProps = {
  question: string | null;
  result: string | null;
  occurredAt: Date | null;
  chamber: string;
  number: number;
  subSession: number;
  source: string;
  sourceUrl?: string | null;
  asOf: Date | null;
  totals: { yea: number; nay: number; present: number; notVoting: number };
  parties: PartyBreakdown[];
  /** Where to see every member's vote. */
  membersHref?: string;
};

function ResultBar({ yea, nay }: { yea: number; nay: number }) {
  const total = yea + nay;
  const yeaPercent = total === 0 ? 0 : (yea / total) * 100;
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${yea} yes, ${nay} no`}
    >
      <div className="bg-support" style={{ width: `${yeaPercent}%` }} />
      <div className="flex-1 bg-oppose" />
    </div>
  );
}

export function RollCallCard(props: RollCallCardProps) {
  const { totals } = props;
  return (
    <div className="space-y-3 rounded-2xl border-2 border-b-4 bg-card p-4" data-testid="roll-call">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium">
          {props.chamber}: {props.question ?? "Recorded vote"}
        </p>
        <p className="text-sm text-muted-foreground">
          {props.occurredAt ? <RelativeDate date={props.occurredAt} label="Voted" /> : null}
          {props.source === "IOWA_LEGISLATURE" ? null : ` · Roll ${props.number}`}
        </p>
      </div>
      {props.result ? <p className="text-sm">{props.result}</p> : null}
      {props.membersHref ? (
        <Link href={props.membersHref} className="inline-block text-sm font-extrabold text-primary hover:underline" data-testid="roll-call-members-link">
          See how every member voted
        </Link>
      ) : null}
      <ResultBar yea={totals.yea} nay={totals.nay} />
      <p className="text-sm">
        <strong>{totals.yea}</strong> yes · <strong>{totals.nay}</strong> no ·{" "}
        {totals.present} present · {totals.notVoting}{" "}didn&apos;t vote
      </p>
      {props.parties.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[320px]">
            <TableHeader>
              <TableRow>
                <TableHead>Party</TableHead>
                <TableHead>Yes</TableHead>
                <TableHead>No</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Didn&apos;t vote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.parties.map((party) => (
                <TableRow key={party.party}>
                  <TableCell>{partyLabel(party.party)}</TableCell>
                  <TableCell>{party.yea}</TableCell>
                  <TableCell>{party.nay}</TableCell>
                  <TableCell>{party.present}</TableCell>
                  <TableCell>{party.notVoting}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {props.source === "IOWA_LEGISLATURE" && props.sourceUrl ? (
        <a href={props.sourceUrl} target="_blank" rel="noreferrer" className="tap inline-block text-sm font-bold text-primary hover:underline" data-testid="journal-link">
          See this page of the journal
        </a>
      ) : null}
      {props.source === "VOTEVIEW" ? (
        <AsOfNote date={props.asOf} label="Senate data from Voteview, which can lag. Fetched" />
      ) : null}
    </div>
  );
}
