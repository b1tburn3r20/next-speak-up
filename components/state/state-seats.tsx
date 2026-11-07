import Link from "next/link";
import { UserRoundX } from "lucide-react";
import { Grid, OuterBlock } from "@/components/blocks";
import { RepReportCard } from "@/components/civic/rep-report-card";
import type { RepRecap } from "@/lib/civic/engage";
import type { MemberCard } from "@/lib/civic/people";
import { chamberName, type ChamberKind, type StateConfig } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

type Score = {
  rep: MemberCard;
  compared: number;
  matched: number;
  byPolicyArea: { policyArea: string; compared: number; percent: number }[];
};

export type SeatWithScore = {
  chamber: ChamberKind;
  code: string | null;
  member: MemberCard | null;
  score: Score | null;
};

/** Someone's state representative and senator. An empty seat says so, rather than disappearing. */
export function StateSeats({
  state,
  seats,
  compact = false,
  recaps,
}: {
  state: StateConfig;
  seats: SeatWithScore[];
  compact?: boolean;
  recaps?: Map<number, RepRecap>;
}) {
  if (seats.length === 0) {
    return (
      <OuterBlock data-testid="seats-unknown">
        <p className="text-sm">
          Your congressional district doesn&apos;t tell us your {chamberName(state, "LOWER")} and {state.chambers.UPPER.name} districts.{" "}
          <Link href={stateRoutes(state.key).home} className="font-bold text-primary hover:underline">
            Find them
          </Link>{" "}
          to see your state legislators.
        </p>
      </OuterBlock>
    );
  }
  return (
    <Grid cols="railPeople" data-testid="state-seats">
      {seats.map((seat) =>
        seat.score && seat.member ? (
          <RepReportCard
            key={seat.chamber}
            compact={compact}
            data={{ ...seat.score, recap: recaps?.get(seat.member.id), stat: null }}
          />
        ) : (
          <OuterBlock key={seat.chamber} className="space-y-2" data-testid="seat-empty">
            <UserRoundX className="size-6 text-muted-foreground" aria-hidden />
            <p className="font-extrabold">
              {chamberName(state, seat.chamber)}
              {seat.code ? `, District ${seat.code}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {seat.code
                ? "This seat is empty right now. Nobody is listed as sitting in it."
                : "Choose your district to see who holds this seat."}
            </p>
          </OuterBlock>
        ),
      )}
    </Grid>
  );
}
