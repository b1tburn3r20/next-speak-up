import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Eye, Globe, Phone } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState } from "@/components/app/page-states";
import { BillStatusBadge } from "@/components/bills/bill-card";
import { Flex, Grid, OuterBlock, PageShell, Section, Stack } from "@/components/blocks";
import { AlignmentRing, PolicyBars, StatTile, VoteSplitBars } from "@/components/civic/charts";
import { NextStepCard } from "@/components/civic/next-step-card";
import { VerdictBadge } from "@/components/civic/rep-report-card";
import { Term } from "@/components/civic/term";
import { FavoriteButton } from "@/components/people/favorite-button";
import { MemberPhoto } from "@/components/people/member-photo";
import { stateName } from "@/components/people/state-name";
import { alignmentByPolicyArea, computeAlignment } from "@/lib/civic/alignment";
import { getMemberPolicyStats, getMemberStats } from "@/lib/civic/engage";
import { billLabel, partyAdjective, positionLabel, roleLabel, seatLabel } from "@/lib/civic/labels";
import {
  getMemberByBioguide,
  getMemberKeyVotes,
  getMemberSponsoredBills,
  getMemberVotePage,
  isMemberFavorite,
} from "@/lib/civic/people";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { comparedVotesFor } from "@/lib/civic/users";
import {
  alignmentVerdict,
  biggestDifference,
  comparedToChamber,
  MIN_VOTES_FOR_VERDICT,
} from "@/lib/civic/verdict";
import { billPath, topicPath } from "@/lib/routes";
import { RelativeDate } from "@/components/app/relative-date";

type PageProps = {
  params: Promise<{ bioguideId: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await getMemberByBioguide((await params).bioguideId);
  return { title: member?.fullName ?? "Member not found" };
}

function positionStyle(position: string): string {
  if (position === "YEA") return "bg-support-tint text-support";
  if (position === "NAY") return "bg-oppose-tint text-oppose";
  return "bg-muted text-muted-foreground";
}

function PositionPill({ position }: { position: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${positionStyle(position)}`}>
      {positionLabel(position)}
    </span>
  );
}

export default async function MemberPage({ params, searchParams }: PageProps) {
  const { bioguideId } = await params;
  const pageNumber = Number((await searchParams)?.page) || 1;
  const member = await getMemberByBioguide(bioguideId);
  if (!member) notFound();

  const current = member.terms.find((term) => term.isCurrent) ?? member.terms[0];
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const [statsById, votePage, sponsored, compared, policyStats, keyVotes, favorite] = await Promise.all([
    getMemberStats([member.id]),
    getMemberVotePage(member.id, pageNumber),
    getMemberSponsoredBills(member.id),
    userId ? comparedVotesFor(userId, member.id) : [],
    getMemberPolicyStats(member.id),
    getMemberKeyVotes(member.id),
    userId ? isMemberFavorite(userId, member.id) : false,
  ]);
  const stat = statsById.get(member.id) ?? null;
  const alignment = computeAlignment(compared);
  const verdict = alignmentVerdict(alignment.compared, alignment.matched);
  const areas = Object.entries(alignmentByPolicyArea(compared)).map(([policyArea, value]) => ({
    policyArea,
    compared: value.compared,
    percent: value.percent ?? 0,
  }));
  const difference = biggestDifference(areas);
  const chamber = current?.chamber.kind ?? "LOWER";
  const recentVotes = votePage.votes;
  const hasLaggingVotes = recentVotes.some((vote) => vote.rollCall.source === "VOTEVIEW");
  const sponsoredRows = policyStats
    .filter((row) => row.sponsoredCount > 0)
    .map((row) => ({
      policyArea: row.policyArea,
      value: row.sponsoredCount,
      detail: row.becameLawCount > 0 ? `${row.becameLawCount} became law` : undefined,
    }));
  const voteRows = policyStats.map((row) => ({
    policyArea: row.policyArea,
    yea: row.yeaVotes,
    nay: row.nayVotes,
  }));
  const topArea = policyAreaByName(sponsoredRows[0]?.policyArea);
  const firstName = member.fullName.split(" ")[0];

  return (
    <PageShell>
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <MemberPhoto name={member.fullName} url={member.imageUrl} party={current?.party} size={112} />
        <div className="min-w-0 space-y-1.5">
          <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{member.fullName}</h1>
          {current ? (
            <p className="text-muted-foreground">
              {partyAdjective(current.party)} {roleLabel(current.role).toLowerCase()},{" "}
              {seatLabel(stateName(current.regionCode), current.district?.code, current.chamber.kind)}
              {current.isCurrent ? "" : " (former)"}
            </p>
          ) : null}
          <Flex gap="md" className="justify-center text-sm sm:justify-start">
            <FavoriteButton bioguideId={bioguideId} signedIn={Boolean(userId)} initialFavorite={favorite} />
            {member.websiteUrl ? (
              <a href={member.websiteUrl} className="inline-flex items-center gap-1 font-bold text-primary hover:underline" target="_blank" rel="noreferrer">
                <Globe className="size-4" aria-hidden /> Website
              </a>
            ) : null}
            {member.phone ? (
              <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                <Phone className="size-4" aria-hidden /> {member.phone}
              </a>
            ) : null}
          </Flex>
        </div>
      </header>

      <OuterBlock data-testid="member-alignment">
        <Flex nowrap gap="lg" align="center">
          <AlignmentRing
            percent={verdict.percent}
            tone={verdict.tone}
            size={96}
            progress={Math.min(alignment.compared, MIN_VOTES_FOR_VERDICT) / MIN_VOTES_FOR_VERDICT}
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
              Do they represent you?
            </p>
            {userId ? (
              <>
                <VerdictBadge tone={verdict.tone} label={verdict.label} />
                <p className="text-sm">{verdict.detail}</p>
                {difference ? (
                  <p className="text-sm font-bold" data-testid="biggest-difference">
                    You differ most on {difference.policyArea.toLowerCase()} ({difference.percent}%).
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm">Sign in and vote on bills to find out.</p>
            )}
            <Link href="/vote" className="inline-block text-sm font-extrabold text-primary hover:underline">
              {userId ? "Vote on more bills" : "Start voting"}
            </Link>
          </div>
        </Flex>
      </OuterBlock>

      <Section title="Are they doing the job?" description="How they compare with the rest of their chamber.">
        <Grid cols="stats" data-testid="member-stats">
          <StatTile
            value={stat?.attendancePercent == null ? "No data" : `${stat.attendancePercent}%`}
            label="Attendance"
            hint={
              stat
                ? [comparedToChamber(stat.attendancePercentile, chamber), `${stat.missedVotes} of ${stat.totalVotes} votes missed`]
                    .filter(Boolean)
                    .join(". ")
                : undefined
            }
            className="bg-card border-2 border-b-4"
          />
          <StatTile
            value={stat?.partyLoyaltyPercent == null ? "No data" : `${stat.partyLoyaltyPercent}%`}
            label={<Term id="party">Votes with party</Term>}
            hint={comparedToChamber(stat?.loyaltyPercentile, chamber)}
            className="bg-card border-2 border-b-4"
          />
          <StatTile
            value={stat?.sponsoredCount ?? sponsored.sponsored}
            label={<Term id="sponsor">Bills sponsored</Term>}
            hint={stat ? `${stat.sponsoredThisCongress} this Congress. Whole career.` : "In this Congress so far"}
            className="bg-card border-2 border-b-4"
          />
          <StatTile
            value={stat?.becameLawCount ?? "No data"}
            label="Became law"
            hint={comparedToChamber(stat?.lawPercentile, chamber)}
            className="bg-card border-2 border-b-4"
          />
        </Grid>
        {stat?.lastVoteAt ? (
          <p className="text-sm text-muted-foreground"><RelativeDate date={stat.lastVoteAt} label="Last recorded vote" /></p>
        ) : null}
      </Section>

      <Grid cols="halves" gap="xl">
        <Section title="What they work on" description="Bills they've sponsored, by policy area.">
          <OuterBlock>
            {sponsoredRows.length > 0 ? (
              <PolicyBars rows={sponsoredRows} label="Bills sponsored by policy area" testId="sponsored-chart" />
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="no-sponsored-chart">
                We don&apos;t have policy areas for their sponsored bills yet.
              </p>
            )}
          </OuterBlock>
        </Section>
        <Section title="How they vote" description="Yes and no on final votes, by policy area.">
          <OuterBlock>
            {voteRows.some((row) => row.yea + row.nay > 0) ? (
              <VoteSplitBars rows={voteRows} />
            ) : (
              <p className="text-sm text-muted-foreground">
                There aren&apos;t enough final votes on bills with a topic yet.
              </p>
            )}
          </OuterBlock>
        </Section>
      </Grid>

      <Section title={`See how ${firstName} voted`}>
        <OuterBlock>
          <Disclosure
            data-testid="member-votes-reveal"
            defaultOpen={pageNumber > 1}
            title={
              <>
                <Eye className="size-4" aria-hidden />
                Show their votes
              </>
            }
          >
            <p className="mt-1 text-sm text-muted-foreground">
              Spoiler: this shows how they voted, which makes it harder to vote without knowing.
            </p>
            {keyVotes.length > 0 ? (
              <div className="mt-3">
                <p className="font-extrabold">Votes on passing bills</p>
                <ul className="divide-y text-sm" data-testid="member-key-votes">
                  {keyVotes.map(({ position, rollCall }) => (
                    <li key={rollCall.id} className="flex items-start justify-between gap-3 py-2">
                      <p className="min-w-0 break-words">
                        {rollCall.bill ? (
                          <Link href={billPath(rollCall.bill.slug)} className="font-bold text-primary hover:underline">
                            {billLabel(rollCall.bill.billType, rollCall.bill.number)}
                          </Link>
                        ) : null}{" "}
                        <span className="text-muted-foreground">{rollCall.bill?.title}</span>
                      </p>
                      <PositionPill position={position} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-3">
              <p className="font-extrabold">Every recorded vote</p>
              {recentVotes.length > 0 ? (
                <ul className="divide-y text-sm" data-testid="member-votes">
                  {recentVotes.map(({ position, rollCall }) => (
                    <li key={rollCall.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="break-words">
                          {rollCall.bill ? (
                            <Link href={billPath(rollCall.bill.slug)} className="font-bold text-primary hover:underline">
                              {billLabel(rollCall.bill.billType, rollCall.bill.number)}
                            </Link>
                          ) : (
                            <span className="font-bold">{rollCall.legislationRef}</span>
                          )}{" "}
                          {rollCall.question}
                        </p>
                        <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                          {rollCall.occurredAt ? <RelativeDate date={rollCall.occurredAt} /> : null}
                          {(rollCall.bill?.title ?? rollCall.description)
                            ? `: ${rollCall.bill?.title ?? rollCall.description}`
                            : ""}
                        </p>
                      </div>
                      <PositionPill position={position} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No recorded votes for this member yet" />
              )}
              {votePage.page > 1 || votePage.hasNext ? (
                <nav className="mt-2 flex justify-between text-sm font-bold" aria-label="Vote pages" data-testid="vote-pages">
                  {votePage.page > 1 ? (
                    <Link href={`?page=${votePage.page - 1}`} className="text-primary hover:underline">
                      Newer votes
                    </Link>
                  ) : (
                    <span />
                  )}
                  {votePage.hasNext ? (
                    <Link href={`?page=${votePage.page + 1}`} className="text-primary hover:underline">
                      Older votes
                    </Link>
                  ) : null}
                </nav>
              ) : null}
              {hasLaggingVotes ? (
                <div className="mt-2">
                  <AsOfNote
                    date={recentVotes.find((vote) => vote.rollCall.source === "VOTEVIEW")?.rollCall.asOf ?? null}
                    label="Senate data from Voteview, which can lag. Fetched"
                  />
                </div>
              ) : null}
            </div>
          </Disclosure>
        </OuterBlock>
      </Section>

      <Section title="Sponsored bills">
        <OuterBlock>
          {sponsored.items.length > 0 ? (
            <Stack gap="sm" data-testid="sponsored-bills">
              {sponsored.items.map((bill) => (
                <div key={bill.slug} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <Link href={billPath(bill.slug)} className="font-extrabold text-primary hover:underline">
                    {billLabel(bill.billType, bill.number)}
                  </Link>{" "}
                  <BillStatusBadge status={bill.currentStatus} />
                  <p className="line-clamp-2 break-words text-sm text-muted-foreground">{bill.title}</p>
                </div>
              ))}
            </Stack>
          ) : (
            <p className="text-sm text-muted-foreground">We don&apos;t have any of their bills yet.</p>
          )}
        </OuterBlock>
      </Section>

      <NextStepCard
        label="Next up"
        step={
          verdict.tone === "unknown" && userId
            ? {
                id: "compare",
                title: `Find out if ${firstName} represents you`,
                description: verdict.detail,
                href: "/vote",
                cta: "Start voting",
                tone: "primary",
              }
            : topArea
              ? {
                  id: "topic",
                  title: `Explore ${topArea.name.toLowerCase()}`,
                  description: `${firstName}'s top topic. ${topArea.explanation}`,
                  href: topicPath(topArea.slug),
                  cta: "Browse this topic",
                  tone: "xp",
                }
              : {
                  id: "reps",
                  title: "See all your reps' report cards",
                  description: "Do they represent you?",
                  href: "/reps",
                  cta: "See report cards",
                  tone: "xp",
                }
        }
      />
    </PageShell>
  );
}
