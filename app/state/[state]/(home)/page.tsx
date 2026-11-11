import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Book, Briefcase, Building2, CalendarDays, MapPin } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCards } from "@/components/bills/bill-cards";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { NextBillCard } from "@/components/civic/next-bill-card";
import { CityGlance } from "@/components/city/city-glance";
import { FindHomeCity } from "@/components/city/find-home-city";
import { DepthTile } from "@/components/state/depth-tile";
import { EventCard } from "@/components/state/event-card";
import { FindStateSeats } from "@/components/state/find-state-seats";
import { PlaceFinder } from "@/components/state/place-finder";
import { StateSessionNote } from "@/components/state/session-note";
import { StateSeats } from "@/components/state/state-seats";
import { buttonVariants } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { listBills } from "@/lib/civic/bills";
import { getCityIndex } from "@/lib/civic/city-registry";
import { getRepRecaps, getStateVoteQueue } from "@/lib/civic/engage";
import { getStateCounts, listEvents } from "@/lib/civic/state";
import { eventJurisdictions, sessionHasStarted, stateByKey, toClientState } from "@/lib/civic/states";
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
    description: `${state.name}'s legislators, bills, cities, and meetings, and whether your legislators vote the way you would.`,
  };
}

/**
 * A state's front door. The first phone screen holds what's yours and the ways in (bills, legislators,
 * cities, meetings), so nothing important waits below a scroll. The rest is short, and goes deeper from
 * links rather than growing here.
 */
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
  const [counts, queue, laws, upcoming, recent, recaps, cities] = await Promise.all([
    getStateCounts(state),
    getStateVoteQueue(state, userId, reps.map((rep) => rep.id), 1),
    listBills({ jurisdiction: state.jurisdiction, status: "SIGNED", limit: 3 }),
    listEvents(places, { when: "upcoming", take: 3 }, now),
    listEvents(places, { when: "past", take: 3 }, now),
    getRepRecaps(reps, now),
    getCityIndex(state),
  ]);
  const nextBill = queue[0];
  const inSession = sessionHasStarted(state, now);
  const homeCity = livesHere ? (metrics?.stateLocation?.city ?? null) : null;

  const showUp = (
    <Stack data-testid="state-show-up">
      {upcoming.events.length > 0 ? (
        upcoming.events.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <>
          <OuterBlock data-testid="state-no-upcoming">
            <p className="font-extrabold">No meetings are posted right now</p>
            <p className="text-sm text-muted-foreground">
              Committee meetings get posted once the session starts, usually only days ahead. These are the latest ones.
            </p>
          </OuterBlock>
          {recent.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </>
      )}
      <Link href={routes.events} className="tap inline-flex font-bold text-primary hover:underline">
        All meetings
      </Link>
    </Stack>
  );
  const signed =
    laws.bills.length > 0 ? (
      <Stack data-testid="state-laws">
        <BillCards bills={laws.bills} />
        <Link href={`${routes.bills}?status=SIGNED`} className="tap inline-flex font-bold text-primary hover:underline">
          Every bill signed into law
        </Link>
      </Stack>
    ) : null;

  return (
    <PageSpacer>
      <PageHeader title={livesHere ? `Your ${state.name}` : state.name} description="Your legislators, the bills they vote on, and every city's City Hall." />
      <StateSessionNote state={state} link={false} />

      {livesHere ? (
        <Stack data-testid="state-yours">
          {seatsKnown ? <StateSeats state={state} seats={seats} recaps={recaps} compact /> : null}
          {!seatsKnown || metrics?.stateLocation === null ? (
            <OuterBlock>
              <FindStateSeats state={toClientState(state)} />
            </OuterBlock>
          ) : null}
        </Stack>
      ) : (
        <OuterBlock className="flex flex-wrap items-center justify-between gap-3" data-testid="state-not-located">
          <p className="min-w-0 flex-1 font-extrabold">Live in {state.name}? Find your legislators and your city.</p>
          <Link href="/onboarding" className={buttonVariants()}>
            <MapPin className="size-4" aria-hidden />
            {userId ? "Set your location" : "Get started"}
          </Link>
        </OuterBlock>
      )}

      <Grid cols="stats" gap="md" data-testid="state-depth">
        <DepthTile
          href={routes.bills}
          icon={Book}
          title="Bills"
          count={counts.bills}
          detail={`${counts.laws.toLocaleString()} signed into law`}
          testId="state-link-bills"
        />
        <DepthTile
          href={routes.legislators}
          icon={Briefcase}
          title="Legislators"
          count={counts.members}
          detail={`Of ${state.chambers.LOWER.seats + state.chambers.UPPER.seats} seats`}
          testId="state-link-legislators"
        />
        <DepthTile href={routes.cities} icon={Building2} title="Cities" count={cities.length} detail="Mayors, City Halls, meetings" testId="state-link-cities" />
        <DepthTile
          href={routes.events}
          icon={CalendarDays}
          title="Meetings"
          count={upcoming.total}
          detail={upcoming.total > 0 ? "Coming up" : "Where to show up"}
          testId="state-link-events"
        />
        {state.cities.map((city) => (
          <DepthTile key={city.key} href={routes.city(city.key)} icon={Building2} title={city.name} detail="Council, agendas, how to speak" testId={`state-link-city-${city.key}`} />
        ))}
      </Grid>

      {homeCity ? (
        <CityGlance state={state} city={homeCity} userId={userId} />
      ) : livesHere ? (
        <FindHomeCity stateKey={state.key} stateName={state.name} citiesHref={routes.cities} />
      ) : null}

      {nextBill ? (
        <Section title="Weigh in" description="Vote first, then see if your legislators agree with you." data-testid="state-next">
          <NextBillCard item={nextBill} />
        </Section>
      ) : null}

      <Section title="Find a city" description="Its mayor, City Hall, legislators, and when the council meets." data-testid="state-city-finder">
        <PlaceFinder
          places={cities.map((city) => ({
            key: city.key,
            name: city.name,
            href: routes.city(city.key),
            detail: city.population ? `${city.population.toLocaleString()} people` : undefined,
            flags: { mayor: city.mayor, hall: city.hall, meetings: city.meetings },
          }))}
          label="Find a city"
          placeholder="Type a city"
          pageSize={6}
          testId="state-cities"
          inputTestId="state-city-search"
          itemTestId="state-city-option"
        />
      </Section>

      {inSession ? (
        <>
          <Section title="Show up">{showUp}</Section>
          {signed ? <Section title="Recently signed into law">{signed}</Section> : null}
        </>
      ) : (
        <OuterBlock className="space-y-1">
          <Disclosure title="Meetings, between sessions" data-testid="state-show-up-more">
            {showUp}
          </Disclosure>
          {signed ? (
            <Disclosure title="Signed into law last session" data-testid="state-laws-more">
              {signed}
            </Disclosure>
          ) : null}
        </OuterBlock>
      )}

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
