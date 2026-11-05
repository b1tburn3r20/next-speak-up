import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { BillCard } from "@/components/bills/bill-card";
import { MemberCard } from "@/components/people/member-card";
import { listBills } from "@/lib/civic/bills";
import { getUserMetrics } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "See what your representatives are up to, and how often you agree.",
};

function Metric({ label, value, testId }: { label: string; value: number; testId?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <p className="text-2xl font-semibold" data-testid={testId}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityChart({ weeks }: { weeks: { weekStart: Date; votes: number }[] }) {
  const highest = Math.max(1, ...weeks.map((week) => week.votes));
  const total = weeks.reduce((sum, week) => sum + week.votes, 0);
  return (
    <div
      role="img"
      aria-label={`${total} votes over the last ${weeks.length} weeks`}
      className="flex h-20 items-end gap-1"
    >
      {weeks.map((week) => (
        <div
          key={week.weekStart.toISOString()}
          title={`${week.votes} votes`}
          className="flex-1 rounded-t bg-chart-1"
          style={{ height: `${Math.max(4, (week.votes / highest) * 100)}%`, opacity: week.votes ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const [{ bills }, metrics] = await Promise.all([
    listBills({ limit: 5 }),
    userId ? getUserMetrics(userId) : null,
  ]);
  const name = session?.user?.username ?? session?.user?.name;

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold">{name ? `Welcome back, ${name}` : "Dashboard"}</h1>
        <p className="text-sm text-muted-foreground">
          What Congress is doing, and how it lines up with you.
        </p>
      </div>

      {metrics ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="user-metrics">
            <Metric label="Votes cast" value={metrics.votesCast} testId="votes-cast" />
            <Metric label="Bills supported" value={metrics.supported} />
            <Metric label="Bills opposed" value={metrics.opposed} />
            <Metric label="Bills followed" value={metrics.following} />
          </div>

          <Panel aria-labelledby="reps-heading">
            <h2 id="reps-heading" className="mb-3 font-semibold">
              Your representatives
            </h2>
            {metrics.reps.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3" data-testid="dashboard-reps">
                {metrics.reps.map(({ rep, percent, compared, byPolicyArea }) => (
                  <MemberCard
                    key={rep.id}
                    member={rep}
                    extra={
                      <div className="mt-1 text-sm" data-testid="alignment">
                        {percent === null ? (
                          <p className="text-muted-foreground">
                            Vote on bills they&apos;ve voted on to compare.
                          </p>
                        ) : (
                          <p>
                            <strong>{percent}%</strong> agreement on {compared} bill
                            {compared === 1 ? "" : "s"}
                          </p>
                        )}
                        {byPolicyArea[0] ? (
                          <p className="text-xs text-muted-foreground">
                            {byPolicyArea[0].policyArea}: {byPolicyArea[0].percent}%
                          </p>
                        ) : null}
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Tell us where you live to see your representatives">
                You can set this in your settings at any time.
              </EmptyState>
            )}
          </Panel>

          <Panel aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="mb-3 font-semibold">
              Your last 12 weeks
            </h2>
            <ActivityChart weeks={metrics.activity} />
          </Panel>
        </>
      ) : (
        <EmptyState
          title="Sign in to see your representatives"
          action={{ href: "/bills", label: "Or start by browsing bills" }}
        >
          You&apos;ll see how often they vote the way you would.
        </EmptyState>
      )}

      <section aria-labelledby="latest-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="latest-heading" className="font-semibold">
            Latest activity in Congress
          </h2>
          <Link href="/bills" className="text-sm underline">
            All bills
          </Link>
        </div>
        {bills.length > 0 ? (
          bills.map((bill) => <BillCard key={bill.id} bill={bill} />)
        ) : (
          <EmptyState title="No bills yet">Bills appear once the data pipeline has run.</EmptyState>
        )}
      </section>
    </PageContainer>
  );
}
