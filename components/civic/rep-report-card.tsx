import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Flex, OuterBlock, Stack } from "@/components/blocks";
import { AlignmentRing, StatTile } from "@/components/civic/charts";
import { PolicyChip } from "@/components/civic/policy-chip";
import { Term } from "@/components/civic/term";
import { MemberPhoto } from "@/components/people/member-photo";
import { stateName } from "@/components/people/state-name";
import { partyAdjective, roleLabel, seatLabel } from "@/lib/civic/labels";
import { bioguideOf, type MemberCard } from "@/lib/civic/people";
import { RECAP_DAYS, type RepRecap } from "@/lib/civic/engage";
import {
  alignmentVerdict,
  biggestDifference,
  comparedToChamber,
  MIN_VOTES_FOR_VERDICT,
  recapSentence,
  type VerdictTone,
} from "@/lib/civic/verdict";
import { cn } from "@/lib/utils";

const TONE_STYLE: Record<VerdictTone, string> = {
  good: "bg-support-tint text-support",
  mixed: "bg-streak-tint text-foreground",
  bad: "bg-oppose-tint text-oppose",
  unknown: "bg-muted text-muted-foreground",
};

export function VerdictBadge({ tone, label }: { tone: VerdictTone; label: string }) {
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-sm font-extrabold", TONE_STYLE[tone])}
      data-testid="verdict"
      data-tone={tone}
    >
      {label}
    </span>
  );
}

export type RepCardData = {
  rep: MemberCard;
  compared: number;
  matched: number;
  byPolicyArea: { policyArea: string; compared: number; percent: number }[];
  recap?: RepRecap;
  stat?: {
    attendancePercent: number | null;
    attendancePercentile: number | null;
    partyLoyaltyPercent: number | null;
    becameLawCount: number;
    sponsoredCount: number;
    lawPercentile: number | null;
  } | null;
};

/** Answers both questions: do they represent me, and are they doing the job? */
export function RepReportCard({ data, compact = false }: { data: RepCardData; compact?: boolean }) {
  const { rep, compared, matched, byPolicyArea, recap, stat } = data;
  const term = rep.terms[0];
  const bioguide = bioguideOf(rep);
  const verdict = alignmentVerdict(compared, matched);
  const difference = biggestDifference(byPolicyArea);
  const href = bioguide ? `/legislators/federal/${bioguide}` : "/legislators";
  const chamber = term?.chamber.kind ?? "LOWER";
  return (
    <OuterBlock data-testid="rep-report-card" className="flex flex-col">
      <Stack gap="md" className="flex-1">
        <Flex nowrap gap="md" align="center">
          <MemberPhoto name={rep.fullName} url={rep.imageUrl} party={term?.party} size={64} />
          <div className="min-w-0">
            <h3 className="break-words text-lg font-extrabold leading-snug">
              <Link href={href} className="hover:underline">
                {rep.fullName}
              </Link>
            </h3>
            {term ? (
              <p className="text-sm text-muted-foreground">
                {partyAdjective(term.party)} {roleLabel(term.role).toLowerCase()},{" "}
                {seatLabel(stateName(term.regionCode), term.district?.code, term.chamber.kind)}
              </p>
            ) : null}
          </div>
        </Flex>

        <Flex nowrap gap="md" align="center" className="rounded-xl bg-muted p-3">
          <AlignmentRing
            percent={verdict.percent}
            tone={verdict.tone}
            size={72}
            progress={Math.min(compared, MIN_VOTES_FOR_VERDICT) / MIN_VOTES_FOR_VERDICT}
          />
          <div className="min-w-0 space-y-1">
            <VerdictBadge tone={verdict.tone} label={verdict.label} />
            <p className="text-sm">{verdict.detail}</p>
          </div>
        </Flex>

        {difference ? (
          <Flex nowrap gap="sm" align="start" className="text-sm" data-testid="biggest-difference">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-streak" aria-hidden />
            <p className="min-w-0">
              You differ most on <PolicyChip name={difference.policyArea} className="mx-0.5 align-middle" />{" "}
              ({difference.percent}% agreement)
            </p>
          </Flex>
        ) : null}

        {recap ? (
          <p className="text-sm" data-testid="rep-recap">
            <span className="font-bold">Lately: </span>
            {recapSentence({
              votes: recap.votes,
              missed: recap.missed,
              lastCongressVote: recap.lastChamberVote,
              days: RECAP_DAYS,
            })}
            {recap.latestBill ? (
              <span className="mt-1 block" data-testid="rep-latest-bill">
                <span className="font-bold">Their latest bill: </span>
                <Link href={`/bills/${recap.latestBill.slug}`} className="font-semibold text-primary hover:underline">
                  {recap.latestBill.label}
                </Link>{" "}
                <span className="line-clamp-2 text-muted-foreground">{recap.latestBill.title}</span>
              </span>
            ) : null}
          </p>
        ) : null}

        {!compact && stat ? (
          <div className="grid grid-cols-2 gap-2" data-testid="job-measures">
            <StatTile
              value={stat.attendancePercent === null ? "No data" : `${stat.attendancePercent}%`}
              label="Shows up to vote"
              hint={comparedToChamber(stat.attendancePercentile, chamber)}
            />
            <StatTile
              value={stat.becameLawCount}
              label={`of ${stat.sponsoredCount} bills became law`}
              hint={comparedToChamber(stat.lawPercentile, chamber)}
            />
          </div>
        ) : null}
      </Stack>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
      >
        See the full report card
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      {!compact && stat?.partyLoyaltyPercent !== null && stat?.partyLoyaltyPercent !== undefined ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Votes with their party {stat.partyLoyaltyPercent}% of the time.{" "}
          <Term id="party">What&apos;s this?</Term>
        </p>
      ) : null}
    </OuterBlock>
  );
}
