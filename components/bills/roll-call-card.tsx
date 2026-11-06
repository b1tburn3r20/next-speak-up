import Link from "next/link";
import { partyLabel, positionLabel } from "@/lib/civic/labels";
import type { PartyBreakdown } from "@/lib/civic/bills";
import { AsOfNote } from "@/components/app/page-states";
import { formatDate } from "./bill-card";

export type RollCallCardProps = {
  question: string | null;
  result: string | null;
  occurredAt: Date | null;
  chamber: string;
  number: number;
  subSession: number;
  source: string;
  asOf: Date | null;
  totals: { yea: number; nay: number; present: number; notVoting: number };
  parties: PartyBreakdown[];
  yourReps?: { name: string; position: string }[];
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
      <div className="bg-chart-1" style={{ width: `${yeaPercent}%` }} />
      <div className="flex-1 bg-destructive/70" />
    </div>
  );
}

export function RollCallCard(props: RollCallCardProps) {
  const { totals } = props;
  return (
    <div className="space-y-3 rounded-lg border p-4" data-testid="roll-call">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium">
          {props.chamber}: {props.question ?? "Recorded vote"}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDate(props.occurredAt)} · Roll {props.number}
        </p>
      </div>
      {props.result ? <p className="text-sm">{props.result}</p> : null}
      {props.membersHref ? (
        <Link href={props.membersHref} className="text-sm underline" data-testid="roll-call-members-link">
          See how every member voted
        </Link>
      ) : null}
      <ResultBar yea={totals.yea} nay={totals.nay} />
      <p className="text-sm">
        <strong>{totals.yea}</strong> yes · <strong>{totals.nay}</strong> no ·{" "}
        {totals.present} present · {totals.notVoting} didn&apos;t vote
      </p>
      {props.parties.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Party</th>
                <th className="py-1 font-medium">Yes</th>
                <th className="py-1 font-medium">No</th>
                <th className="py-1 font-medium">Present</th>
                <th className="py-1 font-medium">Didn&apos;t vote</th>
              </tr>
            </thead>
            <tbody>
              {props.parties.map((party) => (
                <tr key={party.party} className="border-t">
                  <td className="py-1">{partyLabel(party.party)}</td>
                  <td className="py-1">{party.yea}</td>
                  <td className="py-1">{party.nay}</td>
                  <td className="py-1">{party.present}</td>
                  <td className="py-1">{party.notVoting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {props.yourReps && props.yourReps.length > 0 ? (
        <div className="rounded-md bg-muted/50 p-2 text-sm" data-testid="your-reps-votes">
          <p className="font-medium">How your reps voted</p>
          <ul>
            {props.yourReps.map((rep) => (
              <li key={rep.name}>
                {rep.name}: {positionLabel(rep.position)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.source === "VOTEVIEW" ? (
        <AsOfNote date={props.asOf} label="Senate data from Voteview, which can lag. Fetched" />
      ) : null}
    </div>
  );
}
