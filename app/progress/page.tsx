import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Award, Lock, Trophy } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { RelativeDate } from "@/components/app/relative-date";
import { Grid, OuterBlock, PageHeader, PageShell, Section, WithRail } from "@/components/blocks";
import { ActivityChart } from "@/components/civic/charts";
import { LevelCard } from "@/components/civic/level-card";
import { PolicyLeanChart } from "@/components/civic/policy-lean-chart";
import { QuestsCard } from "@/components/civic/quests-card";
import { RankCard } from "@/components/civic/rank-card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEngagementFacts, getPolicyLean, getQuests } from "@/lib/civic/engage";
import { computeProgress } from "@/lib/civic/progress";
import { getLeaderboard } from "@/lib/civic/leaderboard";
import { XP_KIND_LABELS } from "@/lib/civic/progress";
import { bucketWeeks, getUserLocation, getUserTopics } from "@/lib/civic/users";
import { getHudProgress, getXpHistory } from "@/lib/civic/xp";
import { repsForLocation } from "@/lib/civic/people";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Your progress",
  description: "Your level, streak, badges, and how you've voted by topic.",
};

const ACTIVITY_WEEKS = 12;

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <PageShell width="narrow">
        <PageHeader title="Your progress" description="Your level, streak, and badges live here." />
        <EmptyState title="Sign in to start earning XP" action={{ href: routes.vote, label: "Try voting on a bill" }}>
          Every vote earns XP, and shows how well your reps represent you.
        </EmptyState>
      </PageShell>
    );
  }

  const now = new Date();
  const [hud, history, lean, topics, location] = await Promise.all([
    getHudProgress(userId, now),
    getXpHistory(userId),
    getPolicyLean(userId),
    getUserTopics(userId),
    getUserLocation(userId),
  ]);
  const reps = location ? await repsForLocation(location.regionCode, location.districtCode) : [];
  const [facts, quests, board] = await Promise.all([
    getEngagementFacts(userId, reps.map((rep) => rep.id)),
    getQuests(userId, topics, now),
    location ? getLeaderboard(userId, location.regionCode, now) : null,
  ]);
  const { badges } = computeProgress({
    xp: hud.xp,
    voteDates: facts.voteDates,
    now,
    repsFound: reps.length > 0,
    bestMatchCompared: facts.mostComparedWithRep,
    floorVotes: facts.floorVotes,
    policyAreasVoted: facts.policyAreasVoted,
  });
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <PageShell>
      <PageHeader title="Your progress" description="Everything you've earned by taking part." />
      <WithRail
        lead={
          <div className="space-y-4">
            <RankCard initial={hud} />
            <LevelCard initial={hud} />
          </div>
        }
        rail={
          <>
            <QuestsCard quests={quests} streakWaiting={hud.votedToday === 0 ? hud.streak : 0} />
            <Link
              href={routes.leaderboard}
              className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 font-extrabold hover:bg-muted"
              data-testid="progress-leaderboard"
            >
              <Trophy className="size-6 shrink-0 text-streak" aria-hidden />
              <span className="min-w-0 flex-1">
                {board
                  ? `${board.joined && !board.hidden ? "You're" : "You'd be"} #${board.myRank} this week`
                  : "This week's leaderboard"}
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          </>
        }
      >
        <Section title={`Badges (${earned} of ${badges.length})`}>
          <OuterBlock>
            <Grid cols="stats" data-testid="badges">
              {badges.map((badge) => (
                <div key={badge.id} className={badge.earned ? "" : "opacity-50"} data-earned={badge.earned} data-testid="badge">
                  <div
                    className={`mb-1 flex size-10 items-center justify-center rounded-full ${
                      badge.earned ? "bg-streak-tint text-streak" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {badge.earned ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                  </div>
                  <p className="text-sm font-extrabold leading-tight">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </Grid>
          </OuterBlock>
        </Section>

        <Section title="How you vote, by topic" data-testid="progress-lean">
          <OuterBlock>
            <PolicyLeanChart userId={userId} areas={lean} />
          </OuterBlock>
        </Section>

        <Section title={`Your last ${ACTIVITY_WEEKS} weeks`}>
          <OuterBlock data-testid="user-metrics">
            <p className="mb-2 text-sm">
              <strong data-testid="votes-cast">{hud.votesCast}</strong> vote{hud.votesCast === 1 ? "" : "s"} cast
            </p>
            <ActivityChart weeks={bucketWeeks(facts.voteDates, ACTIVITY_WEEKS, now)} />
          </OuterBlock>
        </Section>

        <Section title="Where your XP came from">
          <OuterBlock className="space-y-3" data-testid="xp-history">
            {history.total > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead>XP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.byKind.map((row) => (
                      <TableRow key={row.kind} data-testid="xp-kind">
                        <TableCell>{XP_KIND_LABELS[row.kind]}</TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>{row.xp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div>
                  <p className="mb-1 text-sm font-extrabold">Most recent</p>
                  <ul className="divide-y text-sm">
                    {history.recent.map((event) => (
                      <li key={event.id} className="flex items-center justify-between gap-3 py-1.5" data-testid="xp-recent">
                        <span className="min-w-0 break-words">
                          {XP_KIND_LABELS[event.kind]}, <RelativeDate date={event.createdAt} />
                        </span>
                        <span className="shrink-0 font-extrabold tabular-nums">+{event.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">You haven&apos;t earned any XP yet. Your first vote changes that.</p>
                <Link href={routes.vote} className={buttonVariants()}>
                  Vote on a bill
                </Link>
              </div>
            )}
          </OuterBlock>
        </Section>
      </WithRail>
    </PageShell>
  );
}
