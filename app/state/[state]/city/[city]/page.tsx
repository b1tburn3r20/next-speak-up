import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { EventCard, eventWhen } from "@/components/state/event-card";
import { getStateLocation, listEvents } from "@/lib/civic/state";
import { cityByKey, stateByKey } from "@/lib/civic/states";
import { notFound } from "next/navigation";

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
  return { title: city.name, description: `${city.name} meetings and agendas.` };
}

export default async function CityPage({ params }: CityParams) {
  const { state, city } = await cityFrom(params);
  const session = await getServerSession(authOptions);
  const location = session?.user?.id ? await getStateLocation(session.user.id, state) : null;
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    listEvents([city.jurisdiction], { when: "upcoming", take: 10 }, now),
    listEvents([city.jurisdiction], { when: "past", take: 20 }, now),
  ]);
  const newest = past.events[0];

  return (
    <PageSpacer>
      <PageHeader
        title={location?.city?.key === city.key ? `Your city: ${city.name}` : city.name}
        description="The city council decides things closest to home, and its meetings are open to the public."
      />
      <OuterBlock className="space-y-2" data-testid="city-gaps">
        <h2 className="text-lg font-extrabold">What we have so far</h2>
        <p className="text-sm">
          {city.coverage} {newest ? `The newest agenda there is from ${eventWhen(newest, state.timeZone)}.` : ""} We&apos;d rather show nothing than guess.
        </p>
      </OuterBlock>
      <Section title="Coming up" data-testid="city-upcoming">
        {upcoming.events.length > 0 ? (
          <Stack>
            {upcoming.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
        ) : (
          <EmptyState title="No upcoming meeting is posted">The city posts each agenda shortly before the meeting.</EmptyState>
        )}
      </Section>
      <Section title="Recent meetings" description={`${past.total} on file`} data-testid="city-past">
        <Stack>
          {past.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </Stack>
      </Section>
    </PageSpacer>
  );
}
