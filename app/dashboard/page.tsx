import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Building2, CalendarClock, Landmark, Map } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FORUM_OPEN } from "@/lib/features";
import { BillStatusBadge } from "@/components/bills/bill-card";
import { OuterBlock, PageSpacer, Section, Stack, WithRail } from "@/components/blocks";
import { BlindVoteCard } from "@/components/civic/blind-vote-card";
import { FindReps } from "@/components/civic/find-reps";
import { MyPeople, type MyPeopleGroup, type MyPerson } from "@/components/civic/my-people";
import { NextBillCard } from "@/components/civic/next-bill-card";
import { NextStepCard } from "@/components/civic/next-step-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { ProgressStrip } from "@/components/civic/progress-strip";
import { QuestsCard } from "@/components/civic/quests-card";
import { ThisWeek, type WeekRow } from "@/components/civic/this-week";
import { SectionTabs } from "@/components/app/section-tabs";
import { FindHomeCity } from "@/components/city/find-home-city";
import { MemberCard } from "@/components/people/member-card";
import { seatOf } from "@/components/people/seat";
import { getCityOfficials, getNextRegularMeeting } from "@/lib/civic/city";
import { countStateMeetingsThisWeek } from "@/lib/civic/state";
import { nextScheduledMeeting } from "@/lib/civic/city-logic";
import type { CityContext } from "@/lib/civic/city-registry";
import { getEngagementFacts, getPulseItems, getQuests, getVoteQueue } from "@/lib/civic/engage";
import { floorBoardBillIds, getFloorBoard } from "@/lib/civic/floor";
import { billLabel } from "@/lib/civic/labels";
import { computeNextSteps } from "@/lib/civic/next-steps";
import { listFavoriteMembers, memberKeyOf, type MemberCard as MemberCardData } from "@/lib/civic/people";
import { nextSessionText, sessionHasStarted, type StateConfig } from "@/lib/civic/states";
import { getUserBillStates, getUserDashboardLists, getUserMetrics, getUserTopics } from "@/lib/civic/users";
import { alignmentVerdict } from "@/lib/civic/verdict";
import { getHudProgress } from "@/lib/civic/xp";
import { billPath, cityOfficialPath, memberPath, routes, stateRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Home",
  description: "Who represents you, how well they match you, and the one thing to do next.",
};

const DAY_FORMAT = { weekday: "long", month: "long", day: "numeric" } as const;

/** A person who votes on bills, with whether they vote like you. */
function votingPerson(rep: MemberCardData, compared: number, matched: number): MyPerson {
  const term = rep.terms[0];
  const key = memberKeyOf(rep);
  const verdict = alignmentVerdict(compared, matched);
  return {
    key: `member-${rep.id}`,
    name: rep.fullName,
    imageUrl: rep.imageUrl,
    party: term?.party ?? null,
    // A state legislator's seat already names the chamber ("Iowa House, District 36"). Congress's doesn't.
    seat: term ? (key?.includes(":") ? seatOf(term, key) : `${term.chamber.kind === "UPPER" ? "U.S. Senate" : "U.S. House"}, ${seatOf(term, key)}`) : "",
    href: key ? memberPath(key) : routes.reps,
    verdict: {
      tone: verdict.tone,
      label: verdict.label,
      hint:
        verdict.percent === null
          ? `Vote on ${verdict.votesNeeded} more of their bills to see if you match`
          : `You agreed on ${matched} of ${compared}`,
    },
  };
}

/** The city's line for the week: when its council meets next, from an agenda or its regular schedule. */
async function cityRow(state: StateConfig, city: CityContext, now: Date): Promise<WeekRow> {
  const next = await getNextRegularMeeting(city, now, Boolean(city.config));
  const scheduled = next ? null : nextScheduledMeeting(city.profile?.meetingSchedule, state.timeZone, now);
  const when = next?.startsAt ?? scheduled?.day ?? null;
  const council = city.config?.council.name ?? "City Council";
  return {
    id: "city",
    icon: Building2,
    title: `${city.name} City Hall`,
    detail: when
      ? `${council} ${next ? "meets" : "usually meets"} ${when.toLocaleDateString("en-US", { ...DAY_FORMAT, timeZone: next ? state.timeZone : "UTC" })}`
      : "The mayor, City Hall, and how to speak at a meeting",
    href: stateRoutes(state.key).city(city.key),
    urgent: Boolean(next),
  };
}

async function mayorOf(state: StateConfig, city: CityContext): Promise<MyPerson | null> {
  const officials = await getCityOfficials(city);
  const mayor = officials.find((official) => official.terms[0]?.role === "MAYOR");
  if (!mayor) return null;
  const id = mayor.identifiers[0]?.value;
  return {
    key: `mayor-${mayor.id}`,
    name: mayor.fullName,
    imageUrl: mayor.imageUrl,
    party: null,
    seat: `Mayor of ${city.name}`,
    href: id ? cityOfficialPath(state.key, city.key, id) : stateRoutes(state.key).city(city.key),
  };
}

/** Signed out: what this is, how it works, and one way in. */
async function SignedOutDashboard() {
  const now = new Date();
  const board = await getFloorBoard(now);
  const floorCount = floorBoardBillIds(board).length;
  const steps = computeNextSteps({
    signedIn: false,
    hasLocation: false,
    pulseCount: 0,
    floorCount,
    fewestComparedWithRep: 0,
    votedToday: 0,
    dailyGoal: 3,
    streak: 0,
    votesCast: 0,
    followingCount: 0,
  });
  const how = [
    ["Find your reps", "Tell us where you live, and see who votes for you in Congress, your statehouse, and City Hall."],
    ["Vote on real bills", "The same ones they vote on, explained in plain words. You vote first."],
    ["See if you match", "Then find out how they voted, and whether they represent you."],
  ];
  return (
    <PageSpacer>
      <header className="space-y-2">
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">Does your representative represent you?</h1>
        <p className="text-muted-foreground">Vote on the same bills Congress does, then find out if you match. No jargon, and no party telling you what to think.</p>
      </header>
      <NextStepCard step={steps[0]} label="Start here" />
      <Section title="How it works" data-testid="how-it-works">
        <OuterBlock>
          <ol className="space-y-3">
            {how.map(([title, text], index) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint font-extrabold text-primary">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block font-extrabold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </OuterBlock>
      </Section>
      <Section title="Or look around first">
        <ThisWeek
          rows={[
            {
              id: "congress",
              icon: Landmark,
              title: "Congress",
              detail: floorCount > 0 ? `${floorCount} bill${floorCount === 1 ? "" : "s"} may come up for a vote soon` : "What it may vote on next",
              href: routes.federal.upcoming,
              urgent: floorCount > 0,
            },
            { id: "states", icon: Map, title: "Your state", detail: "Your state legislators, and your city's council", href: routes.states },
          ]}
        />
      </Section>
    </PageSpacer>
  );
}

/**
 * Home, for someone signed in. It answers the app's one question in order: what should I do next (one
 * vote), who represents me (faces, and whether they match me), and what's happening in each of my
 * governments this week. Everything deeper lives on the page each row leads to.
 */
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
  const city = userState ? (metrics.stateLocation?.city ?? null) : null;
  const repIds = [...reps, ...stateReps].map((rep) => rep.id);
  const floorBillIds = floorBoardBillIds(board);
  const [facts, pulse, floorStates, queue, hud, quests, mayor, cityLine, stateMeetings] = await Promise.all([
    getEngagementFacts(userId, repIds),
    getPulseItems(userId, repIds, 1),
    getUserBillStates(userId, floorBillIds),
    getVoteQueue(userId, repIds, 1, now, topics, { state: userState }),
    getHudProgress(userId, now),
    getQuests(userId, topics, now),
    userState && city ? mayorOf(userState, city) : Promise.resolve(null),
    userState && city ? cityRow(userState, city, now) : Promise.resolve(null),
    userState ? countStateMeetingsThisWeek(userState, now) : Promise.resolve(0),
  ]);
  const inSession = userState ? sessionHasStarted(userState, now) : false;
  const unvotedFloor = floorBillIds.filter((id) => !floorStates.get(id)?.position).length;
  const steps = computeNextSteps({
    signedIn: true,
    hasLocation: Boolean(metrics.location),
    pulseCount: facts.pulseCount,
    floorCount: unvotedFloor,
    fewestComparedWithRep: facts.fewestComparedWithRep,
    votedToday: hud.votedToday,
    dailyGoal: hud.dailyGoal,
    streak: hud.streak,
    votesCast: facts.voteDates.length,
    followingCount: facts.followingCount,
  });
  const name = session?.user?.username ?? session?.user?.name;
  const located = metrics.reps.length > 0;

  const people: MyPeopleGroup[] = [
    { label: "In Congress", people: metrics.reps.map(({ rep, compared, matched }) => votingPerson(rep, compared, matched)) },
    ...(userState
      ? [
          {
            label: inSession ? `${userState.name} statehouse` : `${userState.name} statehouse · back ${nextSessionText(userState)}`,
            people: metrics.stateSeats.flatMap((seat) => (seat.member && seat.score ? [votingPerson(seat.member, seat.score.compared, seat.score.matched)] : [])),
          },
        ]
      : []),
    ...(city && mayor ? [{ label: `${city.name} City Hall`, people: [mayor] }] : []),
  ];

  const week: WeekRow[] = [
    {
      id: "congress",
      icon: Landmark,
      title: "Congress",
      detail:
        floorBillIds.length === 0
          ? "Nothing is listed for a vote yet this week"
          : unvotedFloor > 0
            ? `${floorBillIds.length} bills may come up for a vote. You haven't weighed in on ${unvotedFloor}.`
            : `${floorBillIds.length} bills may come up for a vote. You've weighed in on all of them.`,
      href: routes.federal.upcoming,
      urgent: unvotedFloor > 0,
      // The same race as Upcoming votes: how many of this week's bills you've beaten Congress to.
      progress: { done: floorBillIds.length - unvotedFloor, total: floorBillIds.length },
    },
    // Only what's actually happening this week. Out of session, that's interim committee meetings, if any.
    ...(userState && (inSession || stateMeetings > 0)
      ? [
          {
            id: "state",
            icon: CalendarClock,
            title: `${userState.name} Legislature`,
            detail: inSession
              ? stateMeetings > 0
                ? `In session, with ${stateMeetings} committee meeting${stateMeetings === 1 ? "" : "s"} this week`
                : "In session: its bills, your legislators, and its meetings"
              : `${stateMeetings} committee meeting${stateMeetings === 1 ? "" : "s"} this week, between sessions`,
            href: stateMeetings > 0 ? stateRoutes(userState.key).events : stateRoutes(userState.key).home,
            urgent: stateMeetings > 0,
          },
        ]
      : []),
    ...(cityLine ? [cityLine] : []),
    ...(!userState && located ? [{ id: "states", icon: Map, title: "Your state", detail: "We're adding states one at a time. See which are ready.", href: routes.states }] : []),
  ];

  const nextVote = pulse[0] ?? null;
  // Someone new has nothing to list yet, and today's quests already point them to topics.
  const hasLists = lists.followed.length + lists.viewed.length + topics.length + favorites.length + (FORUM_OPEN ? lists.bookmarks.length : 0) > 0;
  const nextBill = queue[0] ?? null;
  const listTabs = [
    {
      id: "following",
      label: `Following (${lists.followed.length})`,
      content: lists.followed.length > 0 ? <BillLinks bills={lists.followed} testId="followed-bills" /> : <Empty>Tap Follow on a bill, and it shows up here.</Empty>,
    },
    {
      id: "recent",
      label: "Recently viewed",
      content: lists.viewed.length > 0 ? <BillLinks bills={lists.viewed} testId="viewed-bills" /> : <Empty>Bills you open show up here.</Empty>,
    },
    {
      id: "topics",
      label: `Topics (${topics.length})`,
      content: (
        <div className="space-y-3" data-testid="dashboard-topics">
          {topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <PolicyChip key={topic} name={topic} link />
              ))}
            </div>
          ) : (
            <Empty>Pick the topics you care about, and those bills come first.</Empty>
          )}
          <Link href={routes.federal.topics} className="inline-block text-sm font-bold text-primary hover:underline">
            {topics.length > 0 ? "Change your topics" : "Pick topics"}
          </Link>
        </div>
      ),
    },
    ...(favorites.length > 0
      ? [
          {
            id: "saved",
            label: `Saved people (${favorites.length})`,
            content: (
              <Stack data-testid="saved-members">
                {favorites.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </Stack>
            ),
          },
        ]
      : []),
    ...(FORUM_OPEN && lists.bookmarks.length > 0
      ? [
          {
            id: "posts",
            label: `Saved posts (${lists.bookmarks.length})`,
            content: (
              <ul className="space-y-1 text-sm" data-testid="forum-bookmarks">
                {lists.bookmarks.map((post) => (
                  <li key={post.id} className="break-words">
                    <Link href={`/forum/posts/${post.id}`} className="font-semibold text-primary hover:underline">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageSpacer>
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{name ? `Hi, ${name}` : "Welcome back"}</h1>
          <p className="text-muted-foreground">
            {located ? "Your next vote, the people who represent you, and what's happening this week." : "First, find out who represents you. It takes a few seconds."}
          </p>
        </div>
        <ProgressStrip initial={hud} />
      </header>

      <WithRail
        lead={
          !located ? (
            <Section title="Who represents you?" description="Your address or ZIP code is enough. We only use it to find your districts." data-testid="dashboard-find-reps">
              <NextStepCard step={steps[0]} label="Step 1" />
              <FindReps />
            </Section>
          ) : nextVote ? (
            <Section
              title="Your next vote"
              description="Your reps voted on this. Vote first, then find out if you match."
              action={{ href: routes.vote, label: "More bills to vote on" }}
              data-testid="pulse"
            >
              <BlindVoteCard item={nextVote} signedIn compact />
            </Section>
          ) : nextBill ? (
            <Section title="Your next vote" action={{ href: routes.vote, label: "More bills to vote on" }} data-testid="dashboard-next">
              <NextBillCard item={nextBill} />
            </Section>
          ) : null
        }
        rail={
          located ? (
            <Section
              title="Who represents you"
              description="Tap anyone to see how they vote, and whether it's how you would."
              action={{ href: routes.reps, label: "Report cards" }}
              data-testid="dashboard-reps"
            >
              <MyPeople groups={people} />
            </Section>
          ) : null
        }
      >
        <Section title="This week" description="What's happening in each of your governments." data-testid="dashboard-week">
          <ThisWeek rows={week} />
          {/* Someone in a state we cover who hasn't said which city: they can say so right here. */}
          {userState && !city ? (
            <FindHomeCity stateKey={userState.key} stateName={userState.name} citiesHref={stateRoutes(userState.key).cities} />
          ) : null}
        </Section>

        <QuestsCard quests={quests} streakWaiting={hud.votedToday === 0 ? hud.streak : 0} />

        {hasLists ? (
          <Section title="Your lists" description="Bills you follow and open, your topics, and what you saved." data-testid="dashboard-lists">
            <SectionTabs tabs={listTabs} testId="list-tabs" tabTestId="list-tab" />
          </Section>
        ) : null}
      </WithRail>
    </PageSpacer>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}

function BillLinks({
  bills,
  testId,
}: {
  bills: { id: number; slug: string; title: string; billType: string; number: number; currentStatus: string }[];
  testId: string;
}) {
  return (
    <OuterBlock>
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
    </OuterBlock>
  );
}
