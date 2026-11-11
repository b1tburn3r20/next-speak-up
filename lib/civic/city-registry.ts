// Every city in a state, from the database. A city with hand-checked settings in lib/civic/states.ts,
// like Des Moines, also gets those, and its richer page. Every other city works from what the pipeline
// found on its own site.
import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { ADOPTED_SECTION, auditCity, coverageGate, type CityAudit, type CoverageGate } from "./city-logic";
import { cityByKey, type CityConfig, type StateConfig } from "./states";

const PROFILE_SELECT = {
  jurisdictionId: true,
  placeGeoid: true,
  slug: true,
  name: true,
  population: true,
  populationYear: true,
  website: true,
  websiteStatus: true,
  agendaUrl: true,
  agendaPlatform: true,
  officialsUrl: true,
  speakUrl: true,
  note: true,
  lane: true,
  phone: true,
  address: true,
  clerkName: true,
  governmentType: true,
  meetingSchedule: true,
  speakInfo: true,
  directorySource: true,
  directoryAsOf: true,
  checkedAt: true,
  jurisdiction: { select: { code: true } },
} satisfies Prisma.CityProfileSelect;

export type CityProfileRow = Prisma.CityProfileGetPayload<{ select: typeof PROFILE_SELECT }>;

/** Enough to find a city's officials and meetings, whichever kind of city it is. */
export type CityRef = { key: string; name: string; jurisdiction: string; personScheme: string };

export type CityContext = CityRef & {
  placeGeoid: string | null;
  /** Hand-checked settings, for the cities that have them. */
  config: CityConfig | null;
  profile: CityProfileRow | null;
};

function contextFor(state: StateConfig, config: CityConfig | null, profile: CityProfileRow | null): CityContext | null {
  if (!config && !profile) return null;
  return {
    key: config?.key ?? (profile as CityProfileRow).slug,
    name: config?.name ?? (profile as CityProfileRow).name,
    jurisdiction: config?.jurisdiction ?? (profile as CityProfileRow).jurisdiction.code,
    // Every city without its own pipeline shares one scheme, with the city's place ID in each person's key.
    personScheme: config?.personScheme ?? `${state.key}_city_official`,
    placeGeoid: config?.placeGeoid ?? profile?.placeGeoid ?? null,
    config,
    profile,
  };
}

export const getCityContext = cache(async (state: StateConfig, slug: string): Promise<CityContext | null> => {
  const config = cityByKey(state, slug);
  const profile = await prisma.cityProfile.findFirst({
    where: config ? { jurisdiction: { code: config.jurisdiction } } : { regionCode: state.regionCode, slug },
    select: PROFILE_SELECT,
  });
  return contextFor(state, config, profile);
});

/** The city at a Census place ID, which is what a location lookup gives. */
export const getCityByGeoid = cache(async (state: StateConfig, placeGeoid: string | null | undefined): Promise<CityContext | null> => {
  if (!placeGeoid) return null;
  const config = state.cities.find((city) => city.placeGeoid === placeGeoid) ?? null;
  const profile = await prisma.cityProfile.findUnique({ where: { placeGeoid }, select: PROFILE_SELECT });
  return contextFor(state, config, profile);
});

export type CityListFilter = { q?: string; coverage?: "meetings" | "site" | "all"; take?: number; skip?: number };

/** A state's cities, biggest first, with how much we have about each. */
export async function listCities(state: StateConfig, filter: CityListFilter = {}) {
  const where: Prisma.CityProfileWhereInput = {
    regionCode: state.regionCode,
    ...(filter.q ? { name: { contains: filter.q.trim() } } : {}),
    ...(filter.coverage === "site" ? { websiteStatus: "FOUND" } : {}),
    ...(filter.coverage === "meetings" ? { jurisdiction: { events: { some: {} } } } : {}),
  };
  const [cities, total] = await Promise.all([
    prisma.cityProfile.findMany({
      where,
      orderBy: [{ population: { sort: "desc", nulls: "last" } }, { name: "asc" }],
      take: filter.take ?? 50,
      skip: filter.skip ?? 0,
      select: {
        ...PROFILE_SELECT,
        jurisdiction: { select: { code: true, _count: { select: { events: true } } } },
      },
    }),
    prisma.cityProfile.count({ where }),
  ]);
  return { cities, total };
}

/** How far the state's cities are covered, for the list's summary. */
export async function getCityCoverage(state: StateConfig) {
  const region = { regionCode: state.regionCode };
  const [cities, sites, blocked, ownerLane, withMeetings, withMayor, withLegislators, withCityHall] = await Promise.all([
    prisma.cityProfile.count({ where: region }),
    prisma.cityProfile.count({ where: { ...region, websiteStatus: "FOUND" } }),
    prisma.cityProfile.count({ where: { ...region, websiteStatus: "BLOCKED" } }),
    prisma.cityProfile.count({ where: { ...region, lane: "OWNER" } }),
    prisma.cityProfile.count({ where: { ...region, jurisdiction: { events: { some: {} } } } }),
    prisma.cityProfile.count({
      where: { ...region, jurisdiction: { chambers: { some: { terms: { some: { isCurrent: true, role: "MAYOR" } } } } } },
    }),
    prisma.cityProfile.count({
      where: { ...region, AND: [{ districts: { some: { chamber: "UPPER" } } }, { districts: { some: { chamber: "LOWER" } } }] },
    }),
    prisma.cityProfile.count({ where: { ...region, OR: [{ phone: { not: null } }, { address: { not: null } }] } }),
  ]);
  return { cities, sites, blocked, ownerLane, withMeetings, withMayor, withLegislators, withCityHall };
}

export type CityAuditRow = { slug: string; name: string; population: number | null; lane: string | null; audit: CityAudit };

/**
 * Every city in the state, checked for what its page should have: the mayor, legislators, City Hall, the
 * next meeting, topics, and how to speak. Read in a handful of queries, so all of a state's cities can be
 * checked at once.
 */
export async function getCityAudits(state: StateConfig, now = new Date()): Promise<{ cities: CityAuditRow[]; gate: CoverageGate }> {
  const profiles = await prisma.cityProfile.findMany({
    where: { regionCode: state.regionCode },
    orderBy: [{ population: { sort: "desc", nulls: "last" } }, { name: "asc" }],
    select: {
      jurisdictionId: true,
      slug: true,
      name: true,
      population: true,
      lane: true,
      phone: true,
      address: true,
      meetingSchedule: true,
      speakUrl: true,
      speakInfo: true,
      jurisdiction: { select: { code: true } },
    },
  });
  const ids = profiles.map((profile) => profile.jurisdictionId);
  const since = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
  const [districts, mayors, upcoming, withTopics] = await Promise.all([
    prisma.cityDistrict.groupBy({ by: ["jurisdictionId", "chamber"], where: { jurisdictionId: { in: ids } }, _count: true }),
    prisma.officeTerm.findMany({
      where: { isCurrent: true, role: "MAYOR", chamber: { jurisdictionId: { in: ids } } },
      select: { chamber: { select: { jurisdictionId: true } } },
    }),
    prisma.civicEvent.groupBy({ by: ["jurisdictionId"], where: { jurisdictionId: { in: ids }, startsAt: { gte: now } } }),
    prisma.civicEvent.groupBy({
      by: ["jurisdictionId"],
      where: { jurisdictionId: { in: ids }, startsAt: { gte: since }, items: { some: { NOT: { section: ADOPTED_SECTION } } } },
    }),
  ]);
  const count = (id: number, chamber: string) => districts.find((row) => row.jurisdictionId === id && row.chamber === chamber)?._count ?? 0;
  const mayorIds = new Set(mayors.map((term) => term.chamber.jurisdictionId));
  const upcomingIds = new Set(upcoming.map((row) => row.jurisdictionId));
  const topicIds = new Set(withTopics.map((row) => row.jurisdictionId));
  const cities = profiles.map((profile) => {
    const config = state.cities.find((city) => city.jurisdiction === profile.jurisdiction.code);
    return {
      slug: config?.key ?? profile.slug,
      name: profile.name,
      population: profile.population,
      lane: profile.lane,
      audit: auditCity({
        mayor: mayorIds.has(profile.jurisdictionId),
        upperDistricts: count(profile.jurisdictionId, "UPPER"),
        lowerDistricts: count(profile.jurisdictionId, "LOWER"),
        phone: profile.phone,
        address: profile.address,
        upcomingMeeting: upcomingIds.has(profile.jurisdictionId),
        meetingSchedule: profile.meetingSchedule,
        topics: topicIds.has(profile.jurisdictionId),
        speakUrl: profile.speakUrl,
        // A city with its own settings says when and how to ask, from those.
        speakInfo: profile.speakInfo ?? (config ? "From the city's own rules" : null),
      }),
    };
  });
  return { cities, gate: coverageGate(cities.map((city) => city.audit)) };
}

export type CityIndexEntry = {
  key: string;
  name: string;
  population: number | null;
  mayor: boolean;
  hall: boolean;
  meetings: boolean;
};

const INDEX_TTL_MS = 10 * 60 * 1000;
const indexCache = new Map<string, { at: number; entries: CityIndexEntry[] }>();

/**
 * Every city in a state, in a few fields each, biggest first: enough to search them all in the browser
 * and show how much each page has. About 30 KB for Iowa's 940, kept for ten minutes, since it changes
 * only when a pipeline runs.
 */
export async function getCityIndex(state: StateConfig, now = Date.now()): Promise<CityIndexEntry[]> {
  const cached = indexCache.get(state.key);
  if (cached && now - cached.at < INDEX_TTL_MS) return cached.entries;
  const profiles = await prisma.cityProfile.findMany({
    where: { regionCode: state.regionCode },
    orderBy: [{ population: { sort: "desc", nulls: "last" } }, { name: "asc" }],
    select: { jurisdictionId: true, slug: true, name: true, population: true, phone: true, address: true, jurisdiction: { select: { code: true } } },
  });
  const ids = profiles.map((profile) => profile.jurisdictionId);
  const [mayors, events] = await Promise.all([
    prisma.officeTerm.findMany({
      where: { isCurrent: true, role: "MAYOR", chamber: { jurisdictionId: { in: ids } } },
      select: { chamber: { select: { jurisdictionId: true } } },
    }),
    prisma.civicEvent.groupBy({ by: ["jurisdictionId"], where: { jurisdictionId: { in: ids } } }),
  ]);
  const mayorIds = new Set(mayors.map((term) => term.chamber.jurisdictionId));
  const eventIds = new Set(events.map((row) => row.jurisdictionId));
  const entries = profiles.map((profile) => ({
    key: state.cities.find((city) => city.jurisdiction === profile.jurisdiction.code)?.key ?? profile.slug,
    name: profile.name,
    population: profile.population,
    mayor: mayorIds.has(profile.jurisdictionId),
    hall: Boolean(profile.phone || profile.address),
    meetings: eventIds.has(profile.jurisdictionId),
  }));
  indexCache.set(state.key, { at: now, entries });
  return entries;
}
