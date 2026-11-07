import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { EventCard, eventWhen } from "@/components/state/event-card";
import { getStateLocation, listEvents } from "@/lib/civic/state";

export const metadata: Metadata = {
  title: "Des Moines",
  description: "Des Moines City Council meetings and agendas.",
};

const CITY = "US-IA-DSM";

export default async function DesMoinesPage() {
  const session = await getServerSession(authOptions);
  const location = session?.user?.id ? await getStateLocation(session.user.id) : null;
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    listEvents([CITY], { when: "upcoming", take: 10 }, now),
    listEvents([CITY], { when: "past", take: 20 }, now),
  ]);
  const newest = past.events[0];

  return (
    <PageSpacer>
      <PageHeader
        title={location?.city ? "Your city: Des Moines" : "Des Moines"}
        description="City Council decides things closest to home, and its meetings are open to the public."
      />
      <OuterBlock className="space-y-2" data-testid="city-gaps">
        <h2 className="text-lg font-extrabold">What we have so far</h2>
        <p className="text-sm">
          Meetings and their agendas, from the city&apos;s public document archive.{" "}
          {newest ? `The newest agenda there is from ${eventWhen(newest)}.` : ""} Council members, your ward, and how they voted aren&apos;t here yet, because we don&apos;t have a source we can read and check. We&apos;d rather show nothing than guess.
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
