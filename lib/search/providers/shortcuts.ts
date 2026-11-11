// "mayor", "city hall", "town hall": words that mean someone's own places. Each becomes a link to theirs,
// like their mayor's page or their council's next meeting, or to where they can find it.

import { getCityOfficials, getNextRegularMeeting } from "@/lib/civic/city";
import { nextScheduledMeeting } from "@/lib/civic/city-logic";
import type { CityContext } from "@/lib/civic/city-registry";
import { getStateLocation, getUserState } from "@/lib/civic/state";
import type { StateConfig } from "@/lib/civic/states";
import { cityMeetingPath, cityOfficialPath, routes, stateRoutes } from "@/lib/routes";
import { matchIntents, MIN_INTENT_QUERY, type IntentId } from "../intents";
import type { SearchProvider, SearchResult } from "../types";

type Places = { state: StateConfig | null; city: CityContext | null };

const DAY = { weekday: "long", month: "long", day: "numeric" } as const;

async function placesFor(userId: string | undefined): Promise<Places> {
  if (!userId) return { state: null, city: null };
  const state = await getUserState(userId);
  const location = state ? await getStateLocation(userId, state) : null;
  return { state, city: location?.city ?? null };
}

/** Where to go for a city question, when we don't know someone's city yet. */
function findYourCity(id: string, title: string, places: Places): SearchResult {
  return {
    id,
    title,
    subtitle: places.state ? `Pick your city in ${places.state.name}, and we'll show you` : "Tell us where you live, and we'll show you",
    href: routes.myCity,
    score: 0,
  };
}

async function resolve(intent: IntentId, places: Places, signedIn: boolean): Promise<SearchResult[]> {
  const { state, city } = places;
  const cityHref = state && city ? stateRoutes(state.key).city(city.key) : null;
  switch (intent) {
    case "mayor": {
      if (!state || !city || !cityHref) return [findYourCity("mayor", "Find your mayor", places)];
      const mayor = (await getCityOfficials(city)).find((official) => official.terms[0]?.role === "MAYOR");
      if (!mayor) return [{ id: "mayor", title: `${city.name} City Hall`, subtitle: "We don't know who the mayor is yet. City Hall can tell you.", href: `${cityHref}#city-hall`, score: 0 }];
      const id = mayor.identifiers[0]?.value;
      return [
        {
          id: "mayor",
          title: `Mayor ${mayor.fullName}`,
          subtitle: `Your mayor, in ${city.name}`,
          href: id ? cityOfficialPath(state.key, city.key, id) : cityHref,
          person: { name: mayor.fullName, imageUrl: mayor.imageUrl, party: null },
          score: 0,
        },
      ];
    }
    case "city-hall": {
      if (!city || !cityHref) return [findYourCity("city-hall", "Find your City Hall", places)];
      const phone = city.profile?.phone;
      return [{ id: "city-hall", title: `${city.name} City Hall`, subtitle: phone ? `Call ${phone}, or see its address and hours` : "Its address, phone, and who runs it", href: `${cityHref}#city-hall`, score: 0 }];
    }
    case "meeting": {
      if (!state || !city || !cityHref) return [findYourCity("meeting", "Find your city council's next meeting", places)];
      const council = city.config?.council.name ?? "City Council";
      const now = new Date();
      const next = await getNextRegularMeeting(city, now, Boolean(city.config));
      if (next) {
        return [
          {
            id: "meeting",
            title: `${city.name} ${council} meeting`,
            subtitle: `${next.startsAt.toLocaleDateString("en-US", { ...DAY, timeZone: state.timeZone })}: the agenda, and how to speak`,
            href: cityMeetingPath(state.key, city.key, next.id),
            score: 0,
          },
        ];
      }
      const scheduled = nextScheduledMeeting(city.profile?.meetingSchedule, state.timeZone, now);
      return [
        {
          id: "meeting",
          title: `${city.name} ${council} meetings`,
          subtitle: scheduled ? `Usually meets ${scheduled.day.toLocaleDateString("en-US", { ...DAY, timeZone: "UTC" })}` : "When they meet, and how to speak",
          href: cityHref,
          score: 0,
        },
      ];
    }
    case "council":
      if (!city || !cityHref) return [findYourCity("council", "Find your city council", places)];
      return [{ id: "council", title: `${city.name} ${city.config?.council.name ?? "City Council"}`, subtitle: "Who's on it, and what they've been taking up", href: cityHref, score: 0 }];
    case "my-reps":
      return [{ id: "my-reps", title: "Your reps in Congress", subtitle: signedIn ? "Who they are, and whether they vote like you" : "Tell us where you live, and see who they are", href: routes.reps, score: 0 }];
    case "state-legislators":
      if (!state) return [{ id: "state-legislators", title: "Your state legislators", subtitle: "See which states are ready", href: routes.states, score: 0 }];
      return [{ id: "state-legislators", title: `Your ${state.name} legislators`, subtitle: "Your state senator and representative come first", href: stateRoutes(state.key).legislators, score: 0 }];
    case "upcoming":
      return [{ id: "upcoming", title: "Upcoming votes in Congress", subtitle: "What may come up this week and next", href: routes.federal.upcoming, score: 0 }];
    case "notifications":
      return signedIn ? [{ id: "notifications", title: "Your notifications", subtitle: "Choose what we remind you about", href: `${routes.settings}#notifications`, score: 0 }] : [];
    case "where-i-live":
      return signedIn ? [{ id: "where-i-live", title: "Change where you live", subtitle: "Moved? Update your address, and your reps change with it", href: `${routes.reps}#where-you-live`, score: 0 }] : [];
    case "progress":
      return signedIn ? [{ id: "progress", title: "Your progress", subtitle: "Your streak, level, and badges", href: routes.progress, score: 0 }] : [];
  }
}

export const shortcutsProvider: SearchProvider = {
  id: "shortcuts",
  label: "Yours",
  minQueryLength: MIN_INTENT_QUERY,
  search: async ({ query, session, limit }) => {
    const matches = matchIntents(query).slice(0, limit);
    if (matches.length === 0) return [];
    const places = await placesFor(session?.user?.id);
    const groups = await Promise.all(
      matches.map(async (match) => (await resolve(match.id, places, Boolean(session?.user))).map((result) => ({ ...result, score: match.score }))),
    );
    return groups.flat().slice(0, limit);
  },
};
