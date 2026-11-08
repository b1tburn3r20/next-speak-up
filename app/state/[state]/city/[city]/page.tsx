import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, PlayCircle } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { CityOfficialCard } from "@/components/city/city-official-card";
import { NextMeetingCard } from "@/components/city/next-meeting-card";
import { WardPicker } from "@/components/city/ward-picker";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { EventCard, eventWhen } from "@/components/state/event-card";
import { getCityOfficials, getLatestTopics, getNextRegularMeeting, getPastMeetings, getUserWard } from "@/lib/civic/city";
import { groupTopics } from "@/lib/civic/city-logic";
import { getStateLocation, listEvents } from "@/lib/civic/state";
import { cityByKey, stateByKey } from "@/lib/civic/states";

type CityParams = { params: Promise<{ state: string; city: string }> };

async function cityFrom(params: CityParams["params"]) {
  const { state: stateKey, city: cityKey } = await params;
  const state = stateByKey(stateKey);
  const city = state ? cityByKey(state, cityKey) : null;
  // The layout already turned these away. This keeps the types honest.
  if (!state || !city) notFound();
  return { state, city };
}

export async function generateMetadata({ params }: CityParams): Promise<Metadata> {
  const { city } = await cityFrom(params);
  return { title: city.name, description: `${city.name}'s mayor, ${city.council.name}, and when you can speak at City Hall.` };
}

export default async function CityPage({ params }: CityParams) {
  const { state, city } = await cityFrom(params);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const now = new Date();
  const [location, ward, officials, next, topics, past, upcoming] = await Promise.all([
    userId ? getStateLocation(userId, state) : Promise.resolve(null),
    userId ? getUserWard(userId, city) : Promise.resolve(null),
    getCityOfficials(city),
    getNextRegularMeeting(city, now),
    getLatestTopics(city, now),
    getPastMeetings(city, now, 8),
    listEvents([city.jurisdiction], { when: "upcoming", take: 6 }, now),
  ]);
  const livesHere = location?.city?.key === city.key;
  const mayor = officials.find((official) => official.terms[0]?.role === "MAYOR");
  const council = officials.filter((official) => official !== mayor);
  const yours = ward ? council.find((official) => official.terms[0]?.district?.code === ward) : null;
  const atLarge = council.filter((official) => official.terms[0]?.district?.code === "AL");

  return (
    <PageSpacer>
      <PageHeader
        title={livesHere ? `Your city: ${city.name}` : city.name}
        description={`The ${city.council.name} decides things closest to home: zoning, streets, parks, and the city budget. Its meetings are open to everyone.`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {mayor ? <CityOfficialCard official={mayor} cityName={city.name} highlight="Your mayor" large /> : null}
        {next ? (
          <NextMeetingCard city={city} stateKey={state.key} meeting={next} timeZone={state.timeZone} now={now} />
        ) : (
          <EmptyState title="No meeting is on the schedule yet">
            The city publishes its schedule a year at a time.{" "}
            <a href={city.meetingsUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
              Check its meetings page
            </a>
            .
          </EmptyState>
        )}
      </div>

      {topics ? (
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
      ) : null}

      <Section
        title={`Your ${city.council.name}`}
        description={`Everyone has the mayor and the at-large members. Your ward has one more, who's yours alone.`}
        data-testid="city-council"
      >
        <Stack>
          {livesHere ? (
            <OuterBlock className="space-y-3" data-testid="your-ward">
              {yours ? (
                <CityOfficialCard official={yours} cityName={city.name} highlight="Your council member" />
              ) : (
                <p className="text-sm">Choose your ward to see which council member is yours.</p>
              )}
              <WardPicker cityKey={city.key} wards={city.council.wards} wardFinderUrl={city.wardFinderUrl} initialWard={ward} />
            </OuterBlock>
          ) : null}
          {council.length > 0 ? (
            <Grid cols="halves" data-testid="city-council-members">
              {[...atLarge, ...council.filter((official) => !atLarge.includes(official))].map((official) => (
                <CityOfficialCard key={official.id} official={official} cityName={city.name} />
              ))}
            </Grid>
          ) : (
            <EmptyState title="The council isn't loaded yet">It appears here once the city&apos;s page has been read.</EmptyState>
          )}
        </Stack>
      </Section>

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
              <p className="font-extrabold">{meeting.title}</p>
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

      <OuterBlock className="space-y-1" data-testid="city-gaps">
        <h2 className="font-extrabold">Where this comes from</h2>
        <p className="text-sm text-muted-foreground">{city.coverage}</p>
      </OuterBlock>
    </PageSpacer>
  );
}
