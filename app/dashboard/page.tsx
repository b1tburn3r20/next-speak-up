import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Award, Lock } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCard, BillStatusBadge } from "@/components/bills/bill-card";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
import { Grid, OuterBlock, PageHeader, PageShell, Section, Stack } from "@/components/blocks";
import { BlindVoteCard } from "@/components/civic/blind-vote-card";
import { MoreSteps, NextStepCard } from "@/components/civic/next-step-card";
import { ProgressStrip } from "@/components/civic/progress-strip";
import { RepReportCard } from "@/components/civic/rep-report-card";
import { MemberCard } from "@/components/people/member-card";
import { listBills } from "@/lib/civic/bills";
import { getEngagementFacts, getMemberStats, getPulseItems, getRepRecaps } from "@/lib/civic/engage";
import { getUpcomingFloorItems } from "@/lib/civic/floor";
import { groupFloorWeeks } from "@/lib/civic/floor-logic";
import { billLabel } from "@/lib/civic/labels";
import { computeNextSteps } from "@/lib/civic/next-steps";
import { listFavoriteMembers } from "@/lib/civic/people";
import { computeProgress } from "@/lib/civic/progress";
import { getUserBillStates, getUserDashboardLists, getUserMetrics } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "See what your representatives are up to, and whether they represent you.",
};

const FLOOR_PREVIEW = 3;

function ActivityChart({ weeks }: { weeks: { weekStart: Date; votes: number }[] }) {
  const highest = Math.max(1, ...weeks.map((week) => week.votes));
  const total = weeks.reduce((sum, week) => sum + week.votes, 0);
  return (
    <div
      role="img"
      aria-label={`${total} votes over the last ${weeks.length} weeks`}
      className="flex h-16 items-end gap-1"
    >
      {weeks.map((week) => (
        <div
          key={week.weekStart.toISOString()}
          title={`${week.votes} votes`}
          className="flex-1 rounded-t bg-primary"
          style={{ height: `${Math.max(6, (week.votes / highest) * 100)}%`, opacity: week.votes ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

function FloorPreview({
  items,
  states,
  signedIn,
  now,
}: {
  items: Awaited<ReturnType<typeof getUpcomingFloorItems>>;
  states: Map<number, { position: string | null; following: boolean }>;
  signedIn: boolean;
  now: Date;
}) {
  const week = groupFloorWeeks(items, now)[0];
  if (!week) {
    return (
      <Section title="On the House floor" data-testid="dashboard-floor">
        <OuterBlock className="text-sm text-muted-foreground">
          Nothing is scheduled right now, so the House may be out of session. New schedules show up
          here as soon as they&apos;re published.
        </OuterBlock>
      </Section>
    );
  }
  return (
    <Section
      title={`Coming up: ${week.label}`}
      description="Weigh in before your representative votes."
      action={{ href: "/bills/upcoming", label: `All ${items.length}` }}
      data-testid="dashboard-floor"
    >
      <Stack>
        {week.items.slice(0, FLOOR_PREVIEW).map((item) => (
          <UpcomingBillCard
            key={item.id}
            item={item}
            signedIn={signedIn}
            state={item.bill ? states.get(item.bill.id) : undefined}
          />
        ))}
      </Stack>
    </Section>
  );
}

async function SignedOutDashboard() {
  const now = new Date();
  const [{ bills }, floorItems] = await Promise.all([listBills({ limit: 3 }), getUpcomingFloorItems(now)]);
  const steps = computeNextSteps({
    signedIn: false,
    hasLocation: false,
    pulseCount: 0,
    floorCount: floorItems.length,
    fewestComparedWithRep: 0,
    votedToday: 0,
    dailyGoal: 3,
    streak: 0,
    votesCast: 0,
    followingCount: 0,
  });
  return (
    <PageShell>
      <PageHeader
        title="Does your representative represent you?"
        description="Vote on the same bills Congress does, then find out if you match. No jargon, and no party telling you what to think."
      />
      <NextStepCard step={steps[0]} label="Start here" />
      <FloorPreview items={floorItems} states={new Map()} signedIn={false} now={now} />
      <Section title="Latest in Congress" action={{ href: "/bills", label: "All bills" }}>
        <Stack>
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </Stack>
      </Section>
      <MoreSteps steps={steps.slice(1)} />
    </PageShell>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return <SignedOutDashboard />;

  const now = new Date();
  const [metrics, floorItems, lists, favorites] = await Promise.all([
    getUserMetrics(userId),
    getUpcomingFloorItems(now),
    getUserDashboardLists(userId),
    listFavoriteMembers(userId),
  ]);
  const reps = metrics.reps.map(({ rep }) => rep);
  const repIds = reps.map((rep) => rep.id);
  const floorBillIds = floorItems.flatMap((item) => (item.bill ? [item.bill.id] : []));
  const [facts, pulse, recaps, stats, floorStates] = await Promise.all([
    getEngagementFacts(userId, repIds),
    getPulseItems(userId, repIds, 2),
    getRepRecaps(reps, now),
    getMemberStats(repIds),
    getUserBillStates(userId, floorBillIds),
  ]);
  const progress = computeProgress({
    voteDates: facts.voteDates,
    now,
    repsFound: reps.length > 0,
    bestMatchCompared: facts.mostComparedWithRep,
    floorVotes: facts.floorVotes,
    policyAreasVoted: facts.policyAreasVoted,
  });
  const unvotedFloor = floorItems.filter(
    (item) => item.bill && !floorStates.get(item.bill.id)?.position,
  ).length;
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
    <PageShell>
      <header className="space-y-3">
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </h1>
        <ProgressStrip
          streak={progress.streak}
          xp={progress.xp}
          level={progress.level}
          votedToday={progress.votedToday}
          dailyGoal={progress.dailyGoal}
        />
      </header>

      <NextStepCard step={steps[0]} />

      {pulse.length > 0 ? (
        <Section
          title="Your reps just voted"
          description="Vote first, then find out if you match."
          action={{ href: "/vote", label: "See more" }}
          data-testid="pulse"
        >
          <Stack>
            {pulse.map((item) => (
              <BlindVoteCard key={item.bill.id} item={item} signedIn />
            ))}
          </Stack>
        </Section>
      ) : null}

      {metrics.reps.length > 0 ? (
        <Section
          title="Do they represent you?"
          action={{ href: "/reps", label: "Report cards" }}
          data-testid="dashboard-reps"
        >
          <Grid cols="people">
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

      <FloorPreview items={floorItems} states={floorStates} signedIn now={now} />

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

      <Section title="Your badges">
        <OuterBlock>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="badges">
            {progress.badges.map((badge) => (
              <li
                key={badge.id}
                title={badge.description}
                className={badge.earned ? "" : "opacity-50"}
                data-earned={badge.earned}
              >
                <div
                  className={`mb-1 flex size-10 items-center justify-center rounded-full ${
                    badge.earned ? "bg-streak-tint text-streak" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {badge.earned ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                </div>
                <p className="text-sm font-extrabold leading-tight">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </li>
            ))}
          </ul>
        </OuterBlock>
      </Section>

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

      <Section title="Your last 12 weeks">
        <OuterBlock data-testid="user-metrics">
          <p className="mb-2 text-sm">
            <strong data-testid="votes-cast">{metrics.votesCast}</strong> votes cast ·{" "}
            <strong>{metrics.supported}</strong> supported · <strong>{metrics.opposed}</strong> opposed ·{" "}
            <strong>{metrics.following}</strong> followed
          </p>
          <ActivityChart weeks={metrics.activity} />
        </OuterBlock>
      </Section>

      <Section title="More to do">
        <MoreSteps steps={steps.slice(1, 4)} />
      </Section>
    </PageShell>
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
          <Link href={`/bills/${bill.slug}`} className="font-extrabold text-primary hover:underline">
            {billLabel(bill.billType, bill.number)}
          </Link>{" "}
          <BillStatusBadge status={bill.currentStatus} />
          <p className="line-clamp-2 break-words text-muted-foreground">{bill.title}</p>
        </li>
      ))}
    </ul>
  );
}
