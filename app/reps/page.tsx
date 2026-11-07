import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Grid, PageHeader, PageShell, Section } from "@/components/blocks";
import { FindReps } from "@/components/civic/find-reps";
import { NextStepCard } from "@/components/civic/next-step-card";
import { RepReportCard } from "@/components/civic/rep-report-card";
import { getMemberStats, getRepRecaps } from "@/lib/civic/engage";
import { computeNextSteps } from "@/lib/civic/next-steps";
import { getUserMetrics } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Your reps",
  description: "Do your representative and senators represent you, and are they doing the job?",
};

export default async function RepsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    const [step] = computeNextSteps({
      signedIn: false,
      hasLocation: false,
      pulseCount: 0,
      floorCount: 0,
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
          title="Your reps' report cards"
          description="Sign in to see your representative and senators, and whether they vote the way you would."
        />
        <NextStepCard step={step} />
      </PageShell>
    );
  }

  const metrics = await getUserMetrics(userId);
  const reps = metrics.reps.map(({ rep }) => rep);
  const [recaps, stats] = await Promise.all([
    getRepRecaps(reps),
    getMemberStats(reps.map((rep) => rep.id)),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Your reps' report cards"
        description="Two questions for each one: do they represent you, and are they doing the job? Only your votes decide the first."
      />
      {metrics.reps.length > 0 ? (
        <Grid cols="people" data-testid="report-cards">
          {metrics.reps.map(({ rep, compared, matched, byPolicyArea }) => (
            <RepReportCard
              key={rep.id}
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
      ) : (
        <FindReps />
      )}
      <Section title="Sharpen your scores">
        <NextStepCard
          step={{
            id: "vote-more",
            title: "Every vote makes these more accurate",
            description: "Vote on bills your reps have voted on.",
            href: "/vote",
            cta: "Start voting",
            tone: "primary",
          }}
        />
      </Section>
    </PageShell>
  );
}
