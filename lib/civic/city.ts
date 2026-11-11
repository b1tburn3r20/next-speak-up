// Queries for a city's government. Each takes the city it's about, from lib/civic/city-registry.ts.
import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { ADOPTED_SECTION } from "./city-logic";
import type { CityRef } from "./city-registry";
import { MEMBER_SELECT, type MemberCard } from "./people";

/** What a query needs: where the city's rows are, and how its officials are keyed. */
type City = Pick<CityRef, "jurisdiction" | "personScheme">;

const officialSelect = (city: City) =>
  ({
    id: true,
    fullName: true,
    imageUrl: true,
    phone: true,
    email: true,
    websiteUrl: true,
    identifiers: { where: { scheme: city.personScheme }, take: 1, select: { value: true } },
    terms: {
      where: { isCurrent: true, chamber: { jurisdiction: { code: city.jurisdiction } } },
      take: 1,
      select: { role: true, startYear: true, endYear: true, district: { select: { code: true } } },
    },
  }) satisfies Prisma.PersonSelect;

const OFFICIAL_SELECT = {
  id: true,
  identifiers: { take: 1, select: { value: true } },
  fullName: true,
  imageUrl: true,
  phone: true,
  email: true,
  websiteUrl: true,
  terms: {
    where: { isCurrent: true },
    take: 1,
    select: { role: true, startYear: true, endYear: true, district: { select: { code: true } } },
  },
} satisfies Prisma.PersonSelect;

export type CityOfficial = Prisma.PersonGetPayload<{ select: typeof OFFICIAL_SELECT }>;

/** The mayor first, then at-large members, then each ward in order. */
export const getCityOfficials = cache(async (city: City): Promise<CityOfficial[]> => {
  const people = await prisma.person.findMany({
    where: { terms: { some: { isCurrent: true, chamber: { jurisdiction: { code: city.jurisdiction } } } } },
    select: officialSelect(city),
  });
  const rank = (person: CityOfficial) => {
    const term = person.terms[0];
    if (term?.role === "MAYOR") return 0;
    const code = term?.district?.code;
    return !code || code === "AL" ? 1 : 1 + Number(code);
  };
  return people.sort((a, b) => rank(a) - rank(b) || a.fullName.localeCompare(b.fullName));
});

const MEETING_SELECT = {
  id: true,
  title: true,
  startsAt: true,
  hasTime: true,
  location: true,
  documentUrl: true,
  minutesUrl: true,
  videoUrl: true,
  sourceUrl: true,
  status: true,
  items: { orderBy: { sortOrder: "asc" }, select: { id: true, section: true, title: true } },
} satisfies Prisma.CivicEventSelect;

export type CityMeeting = Prisma.CivicEventGetPayload<{ select: typeof MEETING_SELECT }>;

// An agenda topic, as opposed to what the minutes say passed.
const AGENDA_ITEM = { OR: [{ section: null }, { section: { not: ADOPTED_SECTION } }] } satisfies Prisma.CivicEventItemWhereInput;

/** What the newest minutes say the council passed, newest meeting first. */
export async function getRecentlyAdopted(city: City, take = 12) {
  return prisma.civicEventItem.findMany({
    where: { section: ADOPTED_SECTION, event: { jurisdiction: { code: city.jurisdiction } } },
    orderBy: [{ event: { startsAt: "desc" } }, { sortOrder: "asc" }],
    take,
    select: { id: true, title: true, event: { select: { id: true, startsAt: true, minutesUrl: true } } },
  });
}

/** The next regular meeting, which is the one people can ask to speak at. Where the city doesn't say
 * "regular", as many small cities don't, it's the next council meeting of any kind. */
export async function getNextRegularMeeting(city: City, now = new Date(), regularOnly = true): Promise<CityMeeting | null> {
  return prisma.civicEvent.findFirst({
    where: {
      jurisdiction: { code: city.jurisdiction },
      startsAt: { gte: now },
      status: "SCHEDULED",
      ...(regularOnly ? { title: { contains: "Regular" } } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: MEETING_SELECT,
  });
}

export async function getUpcomingMeetings(city: City, now = new Date(), take = 4): Promise<CityMeeting[]> {
  return prisma.civicEvent.findMany({
    where: { jurisdiction: { code: city.jurisdiction }, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    take,
    select: MEETING_SELECT,
  });
}

/** One of a city's meetings, for its own page. */
export const getCityMeeting = cache(async (city: City, id: number): Promise<CityMeeting | null> => {
  return prisma.civicEvent.findFirst({ where: { id, jurisdiction: { code: city.jurisdiction } }, select: MEETING_SELECT });
});

export async function getPastMeetings(city: City, now = new Date(), take = 12): Promise<CityMeeting[]> {
  return prisma.civicEvent.findMany({
    where: { jurisdiction: { code: city.jurisdiction }, startsAt: { lt: now } },
    orderBy: { startsAt: "desc" },
    take,
    select: MEETING_SELECT,
  });
}

/** The newest meeting whose agenda we could read, for "what they've been taking up". */
export async function getLatestTopics(city: City, now = new Date(), regularOnly = true): Promise<CityMeeting | null> {
  return prisma.civicEvent.findFirst({
    where: {
      jurisdiction: { code: city.jurisdiction },
      startsAt: { lt: now },
      items: { some: AGENDA_ITEM },
      ...(regularOnly ? { title: { contains: "Regular" } } : {}),
    },
    orderBy: { startsAt: "desc" },
    select: MEETING_SELECT,
  });
}

/** Their ward, if they've told us. Wards aren't in the Census's answer, so it's always their choice. */
export const getUserWard = cache(async (userId: string, city: City): Promise<string | null> => {
  const row = await prisma.userLocation.findFirst({
    where: { userId, jurisdiction: { code: city.jurisdiction } },
    select: { district: { select: { code: true } } },
  });
  return row?.district?.code ?? null;
});

/** Saves their ward, or clears it with null. Returns false if this city has no such ward loaded. */
export async function saveUserWard(userId: string, city: City, regionCode: string, ward: string | null): Promise<boolean> {
  const jurisdiction = await prisma.jurisdiction.findUnique({ where: { code: city.jurisdiction }, select: { id: true } });
  if (!jurisdiction) return false;
  if (!ward) {
    await prisma.userLocation.deleteMany({ where: { userId, jurisdictionId: jurisdiction.id } });
    return true;
  }
  const district = await prisma.district.findFirst({
    where: { code: ward, chamber: { jurisdictionId: jurisdiction.id } },
    select: { id: true },
  });
  if (!district) return false;
  await prisma.userLocation.upsert({
    where: { userId_jurisdictionId: { userId, jurisdictionId: jurisdiction.id } },
    update: { districtId: district.id, regionCode, source: "MANUAL" },
    create: { userId, jurisdictionId: jurisdiction.id, districtId: district.id, regionCode, source: "MANUAL" },
  });
  return true;
}

/** One official, by the ID their city's pipeline gave them. */
export const getCityOfficial = cache(async (city: City, officialId: string): Promise<CityOfficial | null> => {
  const identifier = await prisma.personIdentifier.findUnique({
    where: { scheme_value: { scheme: city.personScheme, value: officialId } },
    select: { person: { select: officialSelect(city) } },
  });
  return identifier?.person.terms.length ? identifier.person : null;
});

/** Every council vote of theirs we could check, newest first. */
export async function getOfficialVotes(city: City, personId: number) {
  return prisma.rollCallPosition.findMany({
    where: { personId, rollCall: { jurisdiction: { code: city.jurisdiction } } },
    orderBy: [{ rollCall: { occurredAt: "desc" } }, { rollCall: { number: "desc" } }],
    select: {
      position: true,
      rollCall: {
        select: {
          id: true,
          legislationRef: true,
          question: true,
          description: true,
          result: true,
          occurredAt: true,
          totalYea: true,
          totalNay: true,
          totalNotVoting: true,
          totalPresent: true,
          sourceUrl: true,
        },
      },
    },
  });
}

export type CityLegislator = {
  chamber: "UPPER" | "LOWER";
  code: string;
  /** How much of the city's land is in this district, from 0 to 1. */
  share: number;
  member: MemberCard | null;
};

/**
 * The state legislators whose districts cover the city, from the Census's maps: the House and Senate
 * districts in order of how much of the city each holds. A seat nobody holds stays, with no member.
 */
export const getCityLegislators = cache(async (jurisdictionId: number, stateJurisdiction: string): Promise<CityLegislator[]> => {
  const districts = await prisma.cityDistrict.findMany({
    where: { jurisdictionId, chamber: { in: ["UPPER", "LOWER"] } },
    orderBy: [{ chamber: "asc" }, { share: "desc" }],
    select: { chamber: true, code: true, share: true },
  });
  if (districts.length === 0) return [];
  const members = await prisma.person.findMany({
    where: {
      terms: {
        some: {
          isCurrent: true,
          district: { code: { in: [...new Set(districts.map((district) => district.code))] } },
          chamber: { kind: { in: ["UPPER", "LOWER"] }, jurisdiction: { code: stateJurisdiction } },
        },
      },
    },
    select: MEMBER_SELECT,
  });
  // A state legislator holds one current term, which says their chamber and district.
  const holder = (chamber: string, code: string) =>
    members.find((member) =>
      member.terms.some((term) => term.chamber.kind === chamber && term.district?.code === code && term.chamber.jurisdiction.code === stateJurisdiction),
    ) ?? null;
  return districts.map((district) => {
    const member = holder(district.chamber, district.code);
    return { chamber: district.chamber as "UPPER" | "LOWER", code: district.code, share: district.share, member };
  });
});
