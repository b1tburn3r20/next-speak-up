import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Trophy } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCard, BillStatusBadge } from "@/components/bills/bill-card";
import { DASHBOARD_WEEK_PREVIEW, FloorBoardGrid, RightNow } from "@/components/bills/floor-board";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack , WithRail } from "@/components/blocks";
import { BlindVoteCard } from "@/components/civic/blind-vote-card";
import { MoreSteps, NextStepCard } from "@/components/civic/next-step-card";
import { ProgressStrip } from "@/components/civic/progress-strip";
import { RepReportCard } from "@/components/civic/rep-report-card";
import { MemberCard } from "@/components/people/member-card";
import { listBills } from "@/lib/civic/bills";
import {
  getEngagementFacts,
  getMemberStats,
  getPulseItems,
  getRepRecaps,
  getSponsoredAreas,
  getVoteQueue, getPolicyLean, getQuests } from "@/lib/civic/engage";
import { floorBoardBillIds, getFloorBoard, type FloorBoard } from "@/lib/civic/floor";
import { billLabel } from "@/lib/civic/labels";
import { computeNextSteps } from "@/lib/civic/next-steps";
import { listFavoriteMembers } from "@/lib/civic/people";
import { QuestsCard } from "@/components/civic/quests-card";
import { PolicyLeanChart } from "@/components/civic/policy-lean-chart";
import { computeProgress } from "@/lib/civic/progress";
import { getHudProgress } from "@/lib/civic/xp";
import { getUserBillStates, getUserDashboardLists, getUserMetrics, getUserTopics } from "@/lib/civic/users";
import { NextBillCard } from "@/components/civic/next-bill-card";
import { RepWorkCard } from "@/components/civic/rep-work-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { billPath, routes, stateRoutes } from "@/lib/routes";
import { StateSessionNote } from "@/components/state/session-note";
import { StateSeats } from "@/components/state/state-seats";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "What's on the House and Senate floor now, and what's coming next.",
};

/** What's happening now, and what's coming: always both chambers, this week and next. */
function FloorSection({
  board,
  states,
  signedIn,
  now,
}: {
  board: FloorBoard;
  states: Map<number, { position: string | null; following: boolean }>;
  signedIn: boolean;
  now: Date;
}) {
  return (
    <Section
      title="On the floor"
      description="Weigh in before your representatives vote. Being listed doesn't guarantee a vote."
      action={{ href: routes.federal.upcoming, label: "Everything coming up" }}
      data-testid="dashboard-floor"
    >
      <FloorBoardGrid board={board} now={now} limit={DASHBOARD_WEEK_PREVIEW} signedIn={signedIn} states={states} />
    </Section>
  );
}

async function SignedOutDashboard() {
  const now = new Date();
  const [{ bills }, board] = await Promise.all([listBills({ limit: 3 }), getFloorBoard(now)]);
  const steps = computeNextSteps({
    signedIn: false,
    hasLocation: false,
    pulseCount: 0,
    floorCount: floorBoardBillIds(board).length,
    fewestComparedWithRep: 0,
    votedToday: 0,
    dailyGoal: 3,
    streak: 0,
    votesCast: 0,
    followingCount: 0,
  });
  return (
    <PageSpacer>
      <PageHeader
        title="Does your representative represent you?"
        description="Vote on the same bills Congress does, then find out if you match. No jargon, and no party telling you what to think."
      />
      <RightNow board={board} />
      <FloorSection board={board} states={new Map()} signedIn={false} now={now} />
      <NextStepCard step={steps[0]} label="Start here" />
      <Section title="Latest in Congress" action={{ href: routes.federal.bills, label: "All bills" }}>
        <Stack>
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </Stack>
      </Section>
      <MoreSteps steps={steps.slice(1)} />
    </PageSpacer>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return <SignedOutDashboard />;

  const now = new Date();
  const [metrics, board, lists, favorites, topics] = await Promise.all([
    getUserMetrics(userId),
    getFloorBoard(now),
    getUserDashboardLists(userId),
    listFavoriteMembers(userId),
    getUserTopics(userId),
  ]);
  const reps = metrics.reps.map(({ rep }) => rep);
  const stateReps = metrics.stateSeats.flatMap((seat) => (seat.member ? [seat.member] : []));
  const userState = metrics.userState;
  const repIds = [...reps, ...stateReps].map((rep) => rep.id);
  const floorBillIds = floorBoardBillIds(board);
  const [facts, pulse, recaps, stats, floorStates, sponsoredAreas, queue] = await Promise.all([
    getEngagementFacts(userId, repIds),
    getPulseItems(userId, repIds, 3),
    getRepRecaps([...reps, ...stateReps], now),
    getMemberStats(repIds),
    getUserBillStates(userId, floorBillIds),
    getSponsoredAreas(repIds),
    getVoteQueue(userId, repIds, 1, now, topics, { state: userState }),
  ]);
  const nextBill = queue[0];
  const [hud, quests, lean] = await Promise.all([
    getHudProgress(userId, now),
    getQuests(userId, topics, now),
    getPolicyLean(userId),
  ]);
  const progress = computeProgress({
    xp: hud.xp,
    voteDates: facts.voteDates,
    now,
    repsFound: reps.length > 0,
    bestMatchCompared: facts.mostComparedWithRep,
    floorVotes: facts.floorVotes,
    policyAreasVoted: facts.policyAreasVoted,
  });
  const unvotedFloor = floorBillIds.filter((id) => !floorStates.get(id)?.position).length;
  const steps = computeNextSteps({
    signedIn: true,
    hasLocation: Boolean(metrics.location),
    pulseCount: facts.pulseCount,
    floorCount: unvotedFloor,
    fewestComparedWithRep: facts.fewestComparedWithRep,
    votedToday: progress.votedToday,
    dailyGoal: progress.dailyGoal,
    streak: progress.streak,
    votesCast: progress.votesCast,
    followingCount: facts.followingCount,
  });
  const name = session?.user?.username ?? session?.user?.name;

  return (
    <PageSpacer>
      <header className="space-y-3">
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </h1>
        <ProgressStrip initial={hud} />
      </header>

      <RightNow board={board} />
      {userState ? <StateSessionNote state={userState} /> : null}

      <WithRail
        lead={<FloorSection board={board} states={floorStates} signedIn now={now} />}
        rail={
          <>
            {metrics.reps.length === 0 ? <NextStepCard step={steps[0]} /> : null}
            {nextBill ? <NextBillCard item={nextBill} /> : null}
            <QuestsCard quests={quests} streakWaiting={hud.votedToday === 0 ? hud.streak : 0} />
            <Link
              href={routes.leaderboard}
              className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 font-extrabold hover:bg-muted"
              data-testid="leaderboard-link"
            >
              <Trophy className="size-6 shrink-0 text-streak" aria-hidden />
              <span className="min-w-0 flex-1">This week&apos;s leaderboard</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
            <Section title="How you vote, by topic" data-testid="dashboard-lean">
              <OuterBlock>
                <PolicyLeanChart userId={userId} areas={lean} />
              </OuterBlock>
            </Section>
            <Link href={routes.progress} className="tap inline-block text-sm font-bold text-primary hover:underline" data-testid="progress-link">
              See your badges and all your progress
            </Link>
          </>
        }
      >

      {metrics.reps.length > 0 ? (
        <Section
          title={userState ? "Your members of Congress" : "Your representatives"}
          description="Your House rep and two senators vote for you in Congress."
          action={{ href: "/reps", label: "Report cards" }}
          data-testid="dashboard-reps"
        >
          <Grid cols="railPeople">
            {metrics.reps.map(({ rep, compared, matched, byPolicyArea }) => (
              <RepReportCard
                key={rep.id}
                compact
                data={{
                  rep,
                  compared,
                  matched,
                  byPolicyArea,
                  recap: recaps.get(rep.id),
                  stat: stats.get(rep.id) ?? null,
                }}
              />
            ))}
          </Grid>
        </Section>
      ) : null}

      {userState ? (
        <Section
          title="Your statehouse"
          description="They vote for you in your state's capitol. Their scores are separate from your members of Congress."
          action={{ href: stateRoutes(userState.key).home, label: `All of ${userState.name}` }}
          data-testid="dashboard-statehouse"
        >
          <StateSeats state={userState} seats={metrics.stateSeats} compact recaps={recaps} />
        </Section>
      ) : null}

      {/* The next bill is already above, so this starts from the one after it. */}
      {pulse.filter((item) => item.bill.id !== nextBill?.bill.id).length > 0 ? (
        <Section
          title="Your reps just voted"
          description="Vote first, then find out if you match."
          action={{ href: "/vote", label: "See more" }}
          data-testid="pulse"
        >
          <Stack>
            {pulse
              .filter((item) => item.bill.id !== nextBill?.bill.id)
              .slice(0, 2)
              .map((item) => (
                <BlindVoteCard key={item.bill.id} item={item} signedIn />
              ))}
          </Stack>
        </Section>
      ) : null}

      {metrics.reps.length > 0 ? (
        <Section
          title="What your reps work on"
          description="The topics they write bills about, and how often those bills become law."
          data-testid="dashboard-rep-work"
        >
          <Grid cols="railPeople">
            {metrics.reps.map(({ rep }) => (
              <RepWorkCard
                key={rep.id}
                data={{
                  rep,
                  stat: stats.get(rep.id) ?? null,
                  areas: sponsoredAreas.get(rep.id) ?? [],
                }}
              />
            ))}
          </Grid>
        </Section>
      ) : null}

      <Section
        title="Topics you track"
        action={{ href: routes.federal.topics, label: topics.length > 0 ? "Change" : "Pick topics" }}
        data-testid="dashboard-topics"
      >
        <OuterBlock>
          {topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topics.map((name) => (
                <PolicyChip key={name} name={name} link />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick the topics you care about, and we&apos;ll put those bills first.
            </p>
          )}
        </OuterBlock>
      </Section>

      <Grid cols="halves">
        <Section title="Bills you follow">
          <OuterBlock>
            {lists.followed.length > 0 ? (
              <BillLinks bills={lists.followed} testId="followed-bills" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap Follow on a bill to keep track of it here.
              </p>
            )}
          </OuterBlock>
        </Section>
        <Section title="Pick up where you left off">
          <OuterBlock>
            {lists.viewed.length > 0 ? (
              <BillLinks bills={lists.viewed} testId="viewed-bills" />
            ) : (
              <p className="text-sm text-muted-foreground">Bills you open will show up here.</p>
            )}
          </OuterBlock>
        </Section>
      </Grid>

      {favorites.length > 0 ? (
        <Section title="Members you saved">
          <Grid cols="people" data-testid="saved-members">
            {favorites.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </Grid>
        </Section>
      ) : null}

      {lists.bookmarks.length > 0 ? (
        <Section title="Saved forum posts">
          <OuterBlock>
            <ul className="space-y-1 text-sm" data-testid="forum-bookmarks">
              {lists.bookmarks.map((post) => (
                <li key={post.id} className="break-words">
                  <Link href={`/forum/posts/${post.id}`} className="font-semibold text-primary hover:underline">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </OuterBlock>
        </Section>
      ) : null}

      <Section title="More to do">
        <MoreSteps steps={steps.slice(1, 4)} />
      </Section>
      </WithRail>
    </PageSpacer>
  );
}

function BillLinks({
  bills,
  testId,
}: {
  bills: {
    id: number;
    slug: string;
    title: string;
    billType: string;
    number: number;
    currentStatus: string;
  }[];
  testId: string;
}) {
  return (
    <ul className="divide-y text-sm" data-testid={testId}>
      {bills.map((bill) => (
        <li key={bill.id} className="py-2 first:pt-0 last:pb-0">
          <Link href={billPath(bill.slug)} className="font-extrabold text-primary hover:underline">
            {billLabel(bill.billType, bill.number)}
          </Link>{" "}
          <BillStatusBadge status={bill.currentStatus} />
          <p className="line-clamp-2 break-words text-muted-foreground">{bill.title}</p>
        </li>
      ))}
    </ul>
  );
}
