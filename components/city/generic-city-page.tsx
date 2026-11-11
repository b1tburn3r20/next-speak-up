import Link from "next/link";
import { CheckCircle2, ExternalLink, FileText, Globe, Home, PlayCircle } from "lucide-react";
import { EmptyState } from "@/components/app/page-states";
import { Grid, OuterBlock, PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { CityGlanceCard } from "@/components/city/city-glance-card";
import { CityLegislators } from "@/components/city/city-legislators";
import { CityOfficialCard } from "@/components/city/city-official-card";
import { CityTabs, type CityTab } from "@/components/city/city-tabs";
import { HomeCityButton } from "@/components/city/home-city-button";
import { eventWhen } from "@/components/state/event-card";
import { getCityLegislators, getCityOfficials, getLatestTopics, getNextRegularMeeting, getPastMeetings, getRecentlyAdopted } from "@/lib/civic/city";
import { groupTopics, nextScheduledMeeting } from "@/lib/civic/city-logic";
import type { CityContext } from "@/lib/civic/city-registry";
import type { StateConfig } from "@/lib/civic/states";
import { cityMeetingPath, cityOfficialPath } from "@/lib/routes";

// The agenda systems some cities hand off to. They draw their pages with scripts, so each needs its own
// reader, which we don't have yet. The page says so, and links people there.
const PLATFORM_NAMES: Record<string, string> = {
  civicclerk: "CivicClerk",
  primegov: "PrimeGov",
  legistar: "Legistar",
  boarddocs: "BoardDocs",
  municode: "Municode Meetings",
  civicweb: "CivicWeb",
  iqm2: "IQM2",
  granicus: "Granicus",
  novusagenda: "NovusAgenda",
};

// Councils meet at least monthly, so two months without a meeting means we've lost track of them.
const STALE_AFTER_DAYS = 60;

type Officials = Awaited<ReturnType<typeof getCityOfficials>>;
type Past = Awaited<ReturnType<typeof getPastMeetings>>;
type Adopted = Awaited<ReturnType<typeof getRecentlyAdopted>>;
type Topics = { meeting: { startsAt: Date; hasTime: boolean }; groups: { section: string; items: { id: number; title: string }[] }[]; upcoming: boolean } | null;

/**
 * Any city's page, from what the pipeline found. The first screen is one card: the next meeting, what to
 * do about it, the mayor, and City Hall. Its legislators follow, and the deeper sections sit in tabs, so
 * the page stays short on a phone. Gaps are said, never filled in.
 */
export async function GenericCityPage({
  state,
  city,
  livesHere,
  canClaim,
  signedIn,
}: {
  state: StateConfig;
  city: CityContext;
  livesHere: boolean;
  /** Whether to offer "I live here": they're signed out, or signed in somewhere in this state. */
  canClaim: boolean;
  signedIn: boolean;
}) {
  const profile = city.profile;
  const now = new Date();
  const [officials, next, latest, past, adopted, legislators] = await Promise.all([
    getCityOfficials(city),
    getNextRegularMeeting(city, now, false),
    getLatestTopics(city, now, false),
    getPastMeetings(city, now, 8),
    getRecentlyAdopted(city),
    profile ? getCityLegislators(profile.jurisdictionId, state.jurisdiction) : Promise.resolve([]),
  ]);
  // With no agenda posted, the council's stated schedule still says when it meets.
  const scheduled = next ? null : nextScheduledMeeting(profile?.meetingSchedule, state.timeZone, now);
  // The next agenda's topics once it's posted, and the last one's until then.
  const nextTopics = next ? groupTopics(next.items) : [];
  const topics: Topics =
    nextTopics.length > 0 && next
      ? { meeting: next, groups: nextTopics, upcoming: true }
      : latest
        ? { meeting: latest, groups: groupTopics(latest.items), upcoming: false }
        : null;
  const mayor = officials.find((official) => official.terms[0]?.role === "MAYOR");
  const council = officials.filter((official) => official.terms[0]?.role !== "MAYOR");
  const hosted = profile?.agendaPlatform ? PLATFORM_NAMES[profile.agendaPlatform] : undefined;
  const agendaHref = profile?.agendaUrl ?? profile?.website ?? null;
  // A city whose newest meeting is months old has likely moved its agendas somewhere we don't read.
  const lastPosted = past[0]?.startsAt ?? null;
  const stale = !next && lastPosted !== null && now.getTime() - lastPosted.getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const population = profile?.population ? `${profile.population.toLocaleString()} people (${profile.populationYear} Census estimate)` : null;
  const tabs = cityTabs({ state, city, topics, adopted, past, council });

  return (
    <PageSpacer>
      <PageHeader
        title={livesHere ? `Your city: ${city.name}` : city.name}
        description={population ?? undefined}
        action={
          livesHere ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1 text-sm font-extrabold text-primary" data-testid="home-city-badge">
              <Home className="size-4" aria-hidden />
              You live here
            </span>
          ) : canClaim ? (
            <HomeCityButton cityKey={city.key} cityName={city.name} signedIn={signedIn} />
          ) : null
        }
      />

      <CityGlanceCard
        state={state}
        city={city}
        mayor={mayor}
        mayorHref={mayor?.identifiers[0] ? cityOfficialPath(state.key, city.key, mayor.identifiers[0].value) : undefined}
        next={next}
        scheduled={scheduled}
        hosted={hosted}
        agendaHref={agendaHref}
        lastPosted={stale ? lastPosted : null}
        livesHere={livesHere}
        signedIn={signedIn}
      />

      <CityLegislators state={state} cityName={city.name} legislators={legislators} />

      {tabs.length > 0 ? (
        <CityTabs tabs={tabs} />
      ) : agendaHref && !hosted ? (
        <EmptyState title="No meetings we could read yet">The city&apos;s agenda page didn&apos;t list dated agendas we could read.</EmptyState>
      ) : null}

      <footer className="space-y-1 text-sm text-muted-foreground" data-testid="city-gaps">
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          {profile?.website && profile.websiteStatus === "FOUND" ? (
            <a href={profile.website} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline" data-testid="city-website">
              <Globe className="size-4" aria-hidden />
              {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          ) : null}
          {agendaHref && agendaHref !== profile?.website ? (
            <a href={agendaHref} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
              <ExternalLink className="size-4" aria-hidden />
              {hosted ? `Agendas, on ${hosted}` : "Agendas"}
            </a>
          ) : null}
        </p>
        <p>
          {profile?.clerkName ? `City clerk: ${profile.clerkName}. ` : ""}
          {profile?.governmentType ? `${profile.governmentType} government. ` : ""}
          {profile?.directorySource
            ? `City Hall from the ${profile.directorySource}${profile.directoryAsOf ? `, as of ${profile.directoryAsOf.toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : ""}. `
            : ""}
          {profile?.note ?? "Read from the city's own site."}
          {profile?.checkedAt ? ` Last checked ${profile.checkedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}
        </p>
      </footer>
    </PageSpacer>
  );
}

/** The page's deeper sections, as tabs. Only ones with something in them, so no tab is empty. */
function cityTabs({
  state,
  city,
  topics,
  adopted,
  past,
  council,
}: {
  state: StateConfig;
  city: CityContext;
  topics: Topics;
  adopted: Adopted;
  past: Past;
  council: Officials;
}): CityTab[] {
  const tabs: CityTab[] = [];
  if (topics && topics.groups.length > 0) {
    tabs.push({
      id: "topics",
      label: topics.upcoming ? "Next agenda" : "Topics",
      content: (
        <OuterBlock className="space-y-3" data-testid="city-topics">
          <p className="text-sm text-muted-foreground">From the {eventWhen(topics.meeting, state.timeZone)} agenda, in its own words.</p>
          {topics.groups.map((group) => (
            <ul key={group.section} className="list-disc space-y-1 pl-5" data-testid="topic-group">
              {group.items.map((item) => (
                <li key={item.id} className="break-words">
                  {item.title}
                </li>
              ))}
            </ul>
          ))}
        </OuterBlock>
      ),
    });
  }
  if (adopted.length > 0) {
    tabs.push({
      id: "passed",
      label: "Passed",
      content: (
        <Stack data-testid="city-adopted">
          <OuterBlock>
            <ul className="divide-y-2">
              {adopted.map((item) => (
                <li key={item.id} className="flex gap-2 py-3 first:pt-0 last:pb-0" data-testid="city-adopted-item">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 space-y-0.5">
                    <span className="block break-words">{item.title}</span>
                    <Link href={cityMeetingPath(state.key, city.key, item.event.id)} className="block text-sm font-bold text-primary hover:underline">
                      {item.event.startsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: state.timeZone })} meeting
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </OuterBlock>
          <p className="text-sm text-muted-foreground">
            What the minutes say carried, with its own motion. Measures passed together on a consent agenda aren&apos;t listed.
          </p>
        </Stack>
      ),
    });
  }
  if (past.length > 0) {
    tabs.push({
      id: "meetings",
      label: "Meetings",
      content: (
        <Grid cols="halves" data-testid="city-past">
          {past.map((meeting) => (
            <OuterBlock key={meeting.id} className="space-y-1" data-testid="city-past-meeting">
              <Link href={cityMeetingPath(state.key, city.key, meeting.id)} className="block break-words font-extrabold text-primary hover:underline">
                {meeting.title}
              </Link>
              <p className="text-sm text-muted-foreground">{eventWhen(meeting, state.timeZone)}</p>
              <div className="flex flex-wrap gap-x-4 text-sm">
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
        </Grid>
      ),
    });
  }
  if (council.length > 0 || city.profile?.officialsUrl) {
    tabs.push({
      id: "council",
      label: "Council",
      content: (
        <Stack data-testid="city-council">
          {council.length > 0 ? (
            <Grid cols="halves">
              {council.map((official) => (
                <CityOfficialCard
                  key={official.id}
                  official={official}
                  cityName={city.name}
                  href={official.identifiers[0] ? cityOfficialPath(state.key, city.key, official.identifiers[0].value) : undefined}
                />
              ))}
            </Grid>
          ) : (
            <p className="text-sm text-muted-foreground">We couldn&apos;t read the council members&apos; names from the city&apos;s site yet.</p>
          )}
          {city.profile?.officialsUrl ? (
            <a href={city.profile.officialsUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <ExternalLink className="size-4" aria-hidden />
              The full council, on the city&apos;s site
            </a>
          ) : null}
        </Stack>
      ),
    });
  }
  return tabs;
}
