import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ExternalLink, Phone } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MemberDetailSkeleton } from "@/components/app/skeletons";
import { EmptyState } from "@/components/app/page-states";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { Flex, OuterBlock, PageSpacer, Section, Stack, WithRail } from "@/components/blocks";
import { RepReportCard } from "@/components/civic/rep-report-card";
import { MemberPhoto } from "@/components/people/member-photo";
import { seatOf } from "@/components/people/seat";
import { billLabel, partyLabel, positionLabel, roleLabel } from "@/lib/civic/labels";
import { getMemberRecentVotes, getMemberSponsoredBills, getMemberVotingStats, memberKeyOf } from "@/lib/civic/people";
import { getStateLegislator } from "@/lib/civic/state";
import { stateByKey } from "@/lib/civic/states";
import { comparedVotesFor } from "@/lib/civic/users";
import { alignmentByPolicyArea, computeAlignment } from "@/lib/civic/alignment";
import { billPath, stateRoutes } from "@/lib/routes";

type PageProps = { params: Promise<{ state: string; id: string }> };

async function legislatorFrom(params: PageProps["params"]) {
  const { state: key, id } = await params;
  const state = stateByKey(key);
  if (!state) notFound();
  return { state, member: await getStateLegislator(state, decodeURIComponent(id)) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { member } = await legislatorFrom(params);
  return { title: member?.fullName ?? "Legislator not found" };
}

async function LegislatorBody({ params }: PageProps) {
  const { state, member } = await legislatorFrom(params);
  if (!member) notFound();
  const term = member.terms[0];
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const [votes, sponsored, stats, compared] = await Promise.all([
    getMemberRecentVotes(member.id, 15),
    getMemberSponsoredBills(member.id, 10),
    getMemberVotingStats(member.id, term?.party ?? null),
    userId ? comparedVotesFor(userId, member.id) : Promise.resolve([]),
  ]);
  const key = memberKeyOf(member);
  const overall = computeAlignment(compared);
  const areas = alignmentByPolicyArea(compared);

  return (
    <PageSpacer>
      <header className="space-y-3">
        <Link href={stateRoutes(state.key).legislators} className="text-sm font-bold text-primary hover:underline">
          ← All {state.name} legislators
        </Link>
        <Flex nowrap gap="md" align="center">
          <MemberPhoto name={member.fullName} url={member.imageUrl} party={term?.party} size={96} />
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="legislator-name">
              {member.fullName}
            </h1>
            {term ? (
              <p className="text-muted-foreground">
                {partyLabel(term.party)} · {roleLabel(term.role)} · {seatOf(term, key)}
              </p>
            ) : null}
            {term && !term.isCurrent ? (
              <p className="mt-1 inline-block rounded-full bg-streak-tint px-3 py-0.5 text-sm font-extrabold" data-testid="legislator-left">
                No longer in office{term.endYear ? ` (left in ${term.endYear})` : ""}
              </p>
            ) : null}
          </div>
        </Flex>
      </header>

      <WithRail
        rail={
          <>
            <OuterBlock className="space-y-2" data-testid="legislator-contact">
              <h2 className="text-lg font-extrabold">Reach them</h2>
              {member.phone ? (
                <a href={`tel:${member.phone.replace(/[^\d]/g, "")}`} className="tap flex items-center gap-2 font-bold text-primary hover:underline">
                  <Phone className="size-4" aria-hidden />
                  {member.phone}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No office phone is listed for them.</p>
              )}
              {member.websiteUrl ? (
                <a href={member.websiteUrl} target="_blank" rel="noreferrer" className="tap flex items-center gap-2 font-bold text-primary hover:underline">
                  <ExternalLink className="size-4" aria-hidden />
                  Their page at {state.sourceName}
                </a>
              ) : null}
            </OuterBlock>
            {userId && overall.compared > 0 ? (
              <RepReportCard
                compact
                data={{
                  rep: member,
                  compared: overall.compared,
                  matched: overall.matched,
                  byPolicyArea: Object.entries(areas).map(([policyArea, value]) => ({
                    policyArea,
                    compared: value.compared,
                    percent: value.percent ?? 0,
                  })),
                  stat: null,
                }}
              />
            ) : null}
            {stats.totalVotes > 0 ? (
              <OuterBlock className="space-y-1" data-testid="legislator-attendance">
                <h2 className="text-lg font-extrabold">On passage votes</h2>
                <p className="text-sm">
                  Showed up for {stats.attendancePercent}% of the {stats.totalVotes.toLocaleString()} votes we could read
                  from the journals.
                </p>
              </OuterBlock>
            ) : null}
          </>
        }
      >
        <Section title="How they voted" description="Bills on their way to passing. Amendments and procedural votes aren't listed." data-testid="legislator-votes">
          {votes.length > 0 ? (
            <OuterBlock>
              <ul className="divide-y-2">
                {votes.map((vote) =>
                  vote.rollCall.bill ? (
                    <li key={vote.rollCall.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0" data-testid="legislator-vote">
                      <Link href={billPath(vote.rollCall.bill.slug)} className="min-w-0 flex-1 break-words font-bold hover:underline">
                        {billLabel(vote.rollCall.bill.billType, vote.rollCall.bill.number)}: {vote.rollCall.bill.title}
                      </Link>
                      <span className="text-sm font-extrabold">
                        {positionLabel(vote.position)}
                        {vote.rollCall.occurredAt ? ` · ${formatDate(vote.rollCall.occurredAt)}` : ""}
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
            </OuterBlock>
          ) : (
            <EmptyState title="No votes yet">Votes appear here once they&apos;ve been read from the journals.</EmptyState>
          )}
        </Section>
        <Section title="Bills they sponsored" data-testid="legislator-sponsored">
          {sponsored.items.length > 0 ? (
            <Stack>
              {sponsored.items.map((bill) => (
                <OuterBlock key={bill.slug} className="space-y-1">
                  <Flex gap="xs">
                    <span className="font-extrabold">{billLabel(bill.billType, bill.number)}</span>
                    <BillStatusBadge status={bill.currentStatus} slug={bill.slug} endDate={bill.session?.endDate} />
                  </Flex>
                  <Link href={billPath(bill.slug)} className="block break-words font-bold hover:underline">
                    {bill.title}
                  </Link>
                </OuterBlock>
              ))}
            </Stack>
          ) : (
            <EmptyState title="None listed">Many {state.name} bills are written by committees, not one person.</EmptyState>
          )}
        </Section>
      </WithRail>
    </PageSpacer>
  );
}

export default async function StateLegislatorPage(props: PageProps) {
  if (!(await legislatorFrom(props.params)).member) notFound();
  return (
    <Suspense fallback={<MemberDetailSkeleton />}>
      <LegislatorBody {...props} />
    </Suspense>
  );
}
