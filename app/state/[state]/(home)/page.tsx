import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Book, Briefcase, Building2, CalendarDays, type LucideIcon } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCards } from "@/components/bills/bill-cards";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { NextBillCard } from "@/components/civic/next-bill-card";
import { EventCard } from "@/components/state/event-card";
import { StateSessionNote } from "@/components/state/session-note";
import { FindStateSeats } from "@/components/state/find-state-seats";
import { StateSeats } from "@/components/state/state-seats";
import { listBills } from "@/lib/civic/bills";
import { getRepRecaps, getStateVoteQueue } from "@/lib/civic/engage";
import { getStateCounts, listEvents } from "@/lib/civic/state";
import { eventJurisdictions, stateByKey, toClientState } from "@/lib/civic/states";
import { notFound } from "next/navigation";
import { getUserMetrics } from "@/lib/civic/users";
import { stateRoutes } from "@/lib/routes";

type StateParams = { params: Promise<{ state: string }> };

async function stateFrom(params: StateParams["params"]) {
  const state = stateByKey((await params).state);
  // The layout already turned away states we don't cover. This keeps the type honest.
  if (!state) notFound();
  return state;
}

export async function generateMetadata({ params }: StateParams): Promise<Metadata> {
  const state = await stateFrom(params);
  return {
    title: { absolute: state.name },
    description: `${state.name}'s legislators, bills, and meetings, and whether your legislators vote the way you would.`,
  };
}

function PlaceLink({ href, icon: Icon, title, detail, testId }: { href: string; icon: LucideIcon; title: string; detail: string; testId: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted" data-testid={testId}>
      <Icon className="size-6 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export default async function StateHubPage({ params }: StateParams) {
  const state = await stateFrom(params);
  const routes = stateRoutes(state.key);
  const places = eventJurisdictions(state);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const now = new Date();
  const metrics = userId ? await getUserMetrics(userId) : null;
  const livesHere = metrics?.userState?.key === state.key;
  const seats = livesHere ? (metrics?.stateSeats ?? []) : [];
  const reps = seats.flatMap((seat) => (seat.member ? [seat.member] : []));
  const seatsKnown = seats.some((seat) => seat.code);
  const [counts, queue, laws, upcoming, recent, recaps] = await Promise.all([
    getStateCounts(state),
    getStateVoteQueue(state, userId, reps.map((rep) => rep.id), 1),
    listBills({ jurisdiction: state.jurisdiction, status: "SIGNED", limit: 3 }),
    listEvents(places, { when: "upcoming", take: 4 }, now),
    listEvents(places, { when: "past", take: 3 }, now),
    getRepRecaps(reps, now),
  ]);
  const nextBill = queue[0];

  return (
    <PageSpacer>
      <PageHeader
        title={livesHere ? `Your ${state.name}` : state.name}
        description="The people who vote for you at the statehouse, what they've decided, and where you can show up."
      />
      <StateSessionNote state={state} detail />

      {livesHere ? (
        <Section title="Your legislators" description="Each one's score is separate, and only your own votes decide it." data-testid="state-yours">
          <Stack>
            {seatsKnown ? <StateSeats state={state} seats={seats} recaps={recaps} /> : null}
            {!seatsKnown || metrics?.stateLocation === null ? (
              <OuterBlock>
                <FindStateSeats state={toClientState(state)} />
              </OuterBlock>
            ) : null}
          </Stack>
        </Section>
      ) : (
        <OuterBlock className="space-y-2" data-testid="state-not-located">
          <h2 className="text-lg font-extrabold">Live in {state.name}?</h2>
          <p className="text-sm">
            {userId
              ? `Set your location to ${state.name}, and we'll find your state legislators.`
              : "Sign in and share your location, and we'll find your state legislators."}{" "}
            <Link href="/onboarding" className="font-bold text-primary hover:underline">
              Set your location
            </Link>
          </p>
        </OuterBlock>
      )}

      {nextBill ? (
        <Section title="Weigh in" description="Vote first, then see if your legislators agree with you." data-testid="state-next">
          <NextBillCard item={nextBill} />
        </Section>
      ) : null}

      <Grid cols="halves">
        <PlaceLink href={routes.bills} icon={Book} title="Bills" detail={`${counts.bills.toLocaleString()} this session, ${counts.laws.toLocaleString()} signed into law`} testId="state-link-bills" />
        <PlaceLink href={routes.legislators} icon={Briefcase} title="Legislators" detail={`${counts.members} sitting now, out of ${state.chambers.LOWER.seats + state.chambers.UPPER.seats} seats`} testId="state-link-legislators" />
        <PlaceLink href={routes.events} icon={CalendarDays} title="Meetings" detail="Where to show up, and what happened" testId="state-link-events" />
        {state.cities.map((city) => (
          <PlaceLink key={city.key} href={routes.city(city.key)} icon={Building2} title={city.name} detail="City meetings and agendas" testId={`state-link-city-${city.key}`} />
        ))}
      </Grid>

      <Section title="Show up" action={{ href: routes.events, label: "All meetings" }} data-testid="state-show-up">
        {upcoming.events.length > 0 ? (
          <Stack>
            {upcoming.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
        ) : (
          <Stack>
            <OuterBlock data-testid="state-no-upcoming">
              <p className="font-extrabold">No meetings are posted right now</p>
              <p className="text-sm text-muted-foreground">
                Committee meetings get posted once the session starts, usually only days ahead. They&apos;ll show up here. These are the latest ones.
              </p>
            </OuterBlock>
            {recent.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
        )}
      </Section>

      {laws.bills.length > 0 ? (
        <Section title="Recently signed into law" action={{ href: `${routes.bills}?status=SIGNED`, label: "All of them" }} data-testid="state-laws">
          <Stack>
            <BillCards bills={laws.bills} />
          </Stack>
        </Section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Voter registration and polling places are run by the{" "}
        <a href={state.electionsUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
          {state.electionsOffice}
        </a>
        . Coolbills never rewards voting in an election, or how anyone votes.
      </p>
    </PageSpacer>
  );
}
