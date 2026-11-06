import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { BillCard, BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
import { MemberCard } from "@/components/people/member-card";
import { listBills } from "@/lib/civic/bills";
import { getUpcomingFloorItems } from "@/lib/civic/floor";
import { groupFloorWeeks } from "@/lib/civic/floor-logic";
import { billLabel, positionLabel } from "@/lib/civic/labels";
import { getRepsRecentVotes, listFavoriteMembers } from "@/lib/civic/people";
import { getUserBillStates, getUserDashboardLists, getUserMetrics } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "See what your representatives are up to, and how often you agree.",
};

const FLOOR_PREVIEW = 4;

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

function PolicyAlignment({
  areas,
}: {
  areas: { policyArea: string; compared: number; percent: number }[];
}) {
  if (areas.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1" data-testid="policy-alignment">
      {areas.slice(0, 4).map((area) => (
        <li key={area.policyArea} className="text-xs">
          <div className="flex justify-between gap-2">
            <span className="min-w-0 truncate">{area.policyArea}</span>
            <span className="shrink-0">{area.percent}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${area.percent}% agreement on ${area.compared} bills`}
          >
            <div className="h-full bg-chart-1" style={{ width: `${area.percent}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function BillLinkList({
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
    latestActionDate: Date | null;
  }[];
  testId: string;
}) {
  return (
    <ul className="divide-y text-sm" data-testid={testId}>
      {bills.map((bill) => (
        <li key={bill.id} className="py-2">
          <Link href={`/bills/${bill.slug}`} className="font-medium underline">
            {billLabel(bill.billType, bill.number)}
          </Link>{" "}
          <BillStatusBadge status={bill.currentStatus} />
          <p className="line-clamp-2 break-words text-muted-foreground">{bill.title}</p>
        </li>
      ))}
    </ul>
  );
}

function FloorSection({
  items,
  signedIn,
  states,
  now,
}: {
  items: Awaited<ReturnType<typeof getUpcomingFloorItems>>;
  signedIn: boolean;
  states: Map<number, { position: string | null; following: boolean }>;
  now: Date;
}) {
  const nextWeek = groupFloorWeeks(items, now)[0];
  return (
    <section aria-labelledby="floor-heading" className="space-y-3" data-testid="dashboard-floor">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="floor-heading" className="font-semibold">
          {nextWeek ? `On the House floor: ${nextWeek.label}` : "On the House floor"}
        </h2>
        <Link href="/bills/upcoming" className="shrink-0 text-sm underline">
          All upcoming
        </Link>
      </div>
      {nextWeek ? (
        <>
          <p className="text-sm text-muted-foreground">Weigh in before your representative votes.</p>
          {nextWeek.items.slice(0, FLOOR_PREVIEW).map((item) => (
            <UpcomingBillCard
              key={item.id}
              item={item}
              signedIn={signedIn}
              state={item.bill ? states.get(item.bill.id) : undefined}
            />
          ))}
        </>
      ) : (
        <EmptyState title="Nothing scheduled right now">
          The House may be out of session. New schedules appear here when they&apos;re published.
        </EmptyState>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const now = new Date();
  const [{ bills }, metrics, floorItems, lists, favorites] = await Promise.all([
    listBills({ limit: 5 }),
    userId ? getUserMetrics(userId) : null,
    getUpcomingFloorItems(now),
    userId ? getUserDashboardLists(userId) : null,
    userId ? listFavoriteMembers(userId) : [],
  ]);
  const floorBillIds = floorItems.flatMap((item) => (item.bill ? [item.bill.id] : []));
  const [floorStates, repVotes] = await Promise.all([
    userId
      ? getUserBillStates(userId, floorBillIds)
      : new Map<number, { position: string | null; following: boolean }>(),
    metrics ? getRepsRecentVotes(metrics.reps.map(({ rep }) => rep.id)) : [],
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="user-metrics">
          <Metric label="Votes cast" value={metrics.votesCast} testId="votes-cast" />
          <Metric label="Bills supported" value={metrics.supported} />
          <Metric label="Bills opposed" value={metrics.opposed} />
          <Metric label="Bills followed" value={metrics.following} />
        </div>
      ) : null}

      <FloorSection items={floorItems} signedIn={Boolean(userId)} states={floorStates} now={now} />

      {metrics ? (
        <>
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
                        <PolicyAlignment areas={byPolicyArea} />
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

          {repVotes.length > 0 ? (
            <Panel aria-labelledby="rep-votes-heading">
              <h2 id="rep-votes-heading" className="mb-2 font-semibold">
                How your representatives voted recently
              </h2>
              <ul className="divide-y text-sm" data-testid="rep-recent-votes">
                {repVotes.map((vote) => (
                  <li
                    key={`${vote.rollCall.id}-${vote.person.fullName}`}
                    className="flex items-start justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="break-words">
                        <span className="font-medium">{vote.person.fullName}</span>
                        {": "}
                        {vote.rollCall.bill ? (
                          <Link href={`/bills/${vote.rollCall.bill.slug}`} className="underline">
                            {billLabel(vote.rollCall.bill.billType, vote.rollCall.bill.number)}
                          </Link>
                        ) : (
                          vote.rollCall.legislationRef
                        )}{" "}
                        {vote.rollCall.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(vote.rollCall.occurredAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">{positionLabel(vote.position)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Panel aria-labelledby="followed-heading">
              <h2 id="followed-heading" className="mb-2 font-semibold">
                Bills you follow
              </h2>
              {lists && lists.followed.length > 0 ? (
                <BillLinkList bills={lists.followed} testId="followed-bills" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Follow a bill to keep track of it here.
                </p>
              )}
            </Panel>
            <Panel aria-labelledby="viewed-heading">
              <h2 id="viewed-heading" className="mb-2 font-semibold">
                Recently viewed
              </h2>
              {lists && lists.viewed.length > 0 ? (
                <BillLinkList bills={lists.viewed} testId="viewed-bills" />
              ) : (
                <p className="text-sm text-muted-foreground">Bills you open will show up here.</p>
              )}
            </Panel>
          </div>

          {favorites.length > 0 ? (
            <Panel aria-labelledby="saved-members-heading">
              <h2 id="saved-members-heading" className="mb-3 font-semibold">
                Members you saved
              </h2>
              <div className="grid gap-3 md:grid-cols-3" data-testid="saved-members">
                {favorites.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </Panel>
          ) : null}

          {lists && lists.bookmarks.length > 0 ? (
            <Panel aria-labelledby="bookmarks-heading">
              <h2 id="bookmarks-heading" className="mb-2 font-semibold">
                Saved forum posts
              </h2>
              <ul className="space-y-1 text-sm" data-testid="forum-bookmarks">
                {lists.bookmarks.map((post) => (
                  <li key={post.id} className="break-words">
                    <Link href={`/forum/posts/${post.id}`} className="underline">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

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
