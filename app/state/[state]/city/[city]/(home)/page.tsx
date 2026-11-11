import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { FileText, Home, PlayCircle } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { CityHallCard } from "@/components/city/city-hall-card";
import { CityLegislators } from "@/components/city/city-legislators";
import { CityOfficialCard } from "@/components/city/city-official-card";
import { NextMeetingCard } from "@/components/city/next-meeting-card";
import { RemindMeButton } from "@/components/notifications/remind-me-button";
import { WardPicker } from "@/components/city/ward-picker";
import { HomeCityButton } from "@/components/city/home-city-button";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { EventCard, eventWhen } from "@/components/state/event-card";
import { getCityLegislators, getCityOfficials, getLatestTopics, getNextRegularMeeting, getPastMeetings, getUserWard } from "@/lib/civic/city";
import { groupTopics } from "@/lib/civic/city-logic";
import { getStateLocation, getUserState, listEvents } from "@/lib/civic/state";
import { stateByKey } from "@/lib/civic/states";
import { getCityContext } from "@/lib/civic/city-registry";
import { GenericCityPage } from "@/components/city/generic-city-page";
import { CityTabs } from "@/components/city/city-tabs";
import { cityMeetingPath, cityOfficialPath } from "@/lib/routes";

type CityParams = { params: Promise<{ state: string; city: string }> };

async function cityFrom(params: CityParams["params"]) {
  const { state: stateKey, city: cityKey } = await params;
  const state = stateByKey(stateKey);
  const context = state ? await getCityContext(state, cityKey) : null;
  // The layout already turned these away. This keeps the types honest.
  if (!state || !context) notFound();
  return { state, context, city: context.config };
}

export async function generateMetadata({ params }: CityParams): Promise<Metadata> {
  const { context } = await cityFrom(params);
  return { title: context.name, description: `${context.name}'s mayor, City Council, and when you can speak at City Hall.` };
}

export default async function CityPage({ params }: CityParams) {
  const { state, context, city: config } = await cityFrom(params);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (!config) {
    const [location, home] = userId ? await Promise.all([getStateLocation(userId, state), getUserState(userId)]) : [null, null];
    return (
      <GenericCityPage
        state={state}
        city={context}
        livesHere={location?.city?.key === context.key}
        canClaim={!userId || home?.key === state.key}
        signedIn={Boolean(userId)}
      />
    );
  }
  // A city with hand-checked settings, like Des Moines, gets the fuller page.
  const city = config;
  const now = new Date();
  const [location, home, ward, officials, next, topics, past, upcoming, legislators] = await Promise.all([
    userId ? getStateLocation(userId, state) : Promise.resolve(null),
    userId ? getUserState(userId) : Promise.resolve(null),
    userId ? getUserWard(userId, city) : Promise.resolve(null),
    getCityOfficials(city),
    getNextRegularMeeting(city, now),
    getLatestTopics(city, now),
    getPastMeetings(city, now, 8),
    listEvents([city.jurisdiction], { when: "upcoming", take: 6 }, now),
    context.profile ? getCityLegislators(context.profile.jurisdictionId, state.jurisdiction) : Promise.resolve([]),
  ]);
  const livesHere = location?.city?.key === city.key;
  const mayor = officials.find((official) => official.terms[0]?.role === "MAYOR");
  const council = officials.filter((official) => official !== mayor);
  const yours = ward ? council.find((official) => official.terms[0]?.district?.code === ward) : null;
  const officialHref = (official: (typeof officials)[number]) =>
    official.identifiers[0] ? cityOfficialPath(state.key, city.key, official.identifiers[0].value) : undefined;
  const atLarge = council.filter((official) => official.terms[0]?.district?.code === "AL");

  return (
    <PageSpacer>
      <PageHeader
        title={livesHere ? `Your city: ${city.name}` : city.name}
        description={`The ${city.council.name} decides things closest to home: zoning, streets, parks, and the city budget. Its meetings are open to everyone.`}
        action={
          livesHere ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1 text-sm font-extrabold text-primary" data-testid="home-city-badge">
              <Home className="size-4" aria-hidden />
              You live here
            </span>
          ) : !userId || home?.key === state.key ? (
            <HomeCityButton cityKey={city.key} cityName={city.name} signedIn={Boolean(userId)} />
          ) : null
        }
      />

      {/* The first screen: when the council meets and what to do about it, then who runs City Hall. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {next ? (
          <div className="space-y-2">
            <NextMeetingCard city={city} stateKey={state.key} meeting={next} timeZone={state.timeZone} now={now} />
            <RemindMeButton cityKey={city.key} cityName={city.name} livesHere={livesHere} signedIn={Boolean(userId)} className="w-full" />
          </div>
        ) : (
          <EmptyState title="No meeting is on the schedule yet">
            The city publishes its schedule a year at a time.{" "}
            <a href={city.meetingsUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
              Check its meetings page
            </a>
            .
          </EmptyState>
        )}
        <div className="space-y-4">
          {mayor ? <CityOfficialCard official={mayor} cityName={city.name} highlight="Your mayor" href={officialHref(mayor)} /> : null}
          <CityHallCard profile={context.profile} fallbackUrl={city.meetingsUrl} />
        </div>
      </div>

      <CityLegislators state={state} cityName={city.name} legislators={legislators} />

      <CityTabs
        tabs={[
          ...(topics
            ? [
                {
                  id: "topics",
                  label: "Topics",
                  content: (
                    <Section
                      title="What they've been taking up"
                      description={`From the ${eventWhen(topics, state.timeZone)} agenda, in its own words. Routine items passed together aren't listed.`}
                      data-testid="city-topics"
                    >
                      <OuterBlock className="space-y-4">
                        {groupTopics(topics.items).map((group) => (
                          <div key={group.section} className="space-y-1.5" data-testid="topic-group" data-section={group.section}>
                            <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">{group.section}</h3>
                            <ul className="list-disc space-y-1 pl-5">
                              {group.items.map((item) => (
                                <li key={item.id} className="break-words">{item.title}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {topics.documentUrl ? (
                          <a href={topics.documentUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                            <FileText className="size-4" aria-hidden />
                            The full agenda
                          </a>
                        ) : null}
                      </OuterBlock>
                    </Section>
                  ),
                },
              ]
            : []),
          {
            id: "council",
            label: livesHere ? "Your council" : "Council",
            content: (
              <Section
                title={`The ${city.council.name}`}
                description="Everyone has the mayor and the at-large members. Each ward has one more, who's theirs alone."
                data-testid="city-council"
              >
                <Stack>
                  {livesHere ? (
                    <OuterBlock className="space-y-3" data-testid="your-ward">
                      {yours ? (
                        <CityOfficialCard official={yours} cityName={city.name} highlight="Your council member" href={officialHref(yours)} />
                      ) : (
                        <p className="text-sm">Choose your ward to see which council member is yours.</p>
                      )}
                      <WardPicker cityKey={city.key} wards={city.council.wards} wardFinderUrl={city.wardFinderUrl} initialWard={ward} />
                    </OuterBlock>
                  ) : null}
                  {council.length > 0 ? (
                    <Grid cols="halves" data-testid="city-council-members">
                      {[...atLarge, ...council.filter((official) => !atLarge.includes(official))].map((official) => (
                        <CityOfficialCard key={official.id} official={official} cityName={city.name} href={officialHref(official)} />
                      ))}
                    </Grid>
                  ) : (
                    <EmptyState title="The council isn't loaded yet">It appears here once the city&apos;s page has been read.</EmptyState>
                  )}
                </Stack>
              </Section>
            ),
          },
          {
            id: "meetings",
            label: "Meetings",
            content: (
              <Stack gap="xl">
                {upcoming.events.length > 1 ? (
                  <Section title="Also coming up" data-testid="city-upcoming">
                    <Stack>
                      {upcoming.events.slice(1).map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </Stack>
                  </Section>
                ) : null}
                <Section title="Recent meetings" description="Agendas, minutes, and recordings, as the city posted them." data-testid="city-past">
                  <Stack>
                    {past.map((meeting) => (
                      <OuterBlock key={meeting.id} className="space-y-1.5" data-testid="city-past-meeting">
                        <Link href={cityMeetingPath(state.key, city.key, meeting.id)} className="block break-words font-extrabold text-primary hover:underline">
                          {meeting.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{eventWhen(meeting, state.timeZone)}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          {meeting.documentUrl ? (
                            <a href={meeting.documentUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 font-bold text-primary hover:underline">
                              <FileText className="size-4" aria-hidden />
                              Agenda
                            </a>
                          ) : null}
                          {meeting.minutesUrl ? (
                            <a href={meeting.minutesUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 font-bold text-primary hover:underline">
                              <FileText className="size-4" aria-hidden />
                              Minutes
                            </a>
                          ) : null}
                          {meeting.videoUrl ? (
                            <a href={meeting.videoUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 font-bold text-primary hover:underline">
                              <PlayCircle className="size-4" aria-hidden />
                              Watch it
                            </a>
                          ) : null}
                        </div>
                      </OuterBlock>
                    ))}
                  </Stack>
                </Section>
              </Stack>
            ),
          },
        ]}
      />

      <OuterBlock className="space-y-1" data-testid="city-gaps">
        <h2 className="font-extrabold">Where this comes from</h2>
        <p className="text-sm text-muted-foreground">{city.coverage}</p>
      </OuterBlock>
    </PageSpacer>
  );
}
