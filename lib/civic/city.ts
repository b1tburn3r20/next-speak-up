// Queries for a city's government. Each takes the city it's about, from lib/civic/states.ts.
import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import type { CityConfig } from "./states";

const OFFICIAL_SELECT = {
  id: true,
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
export const getCityOfficials = cache(async (city: CityConfig): Promise<CityOfficial[]> => {
  const people = await prisma.person.findMany({
    where: { terms: { some: { isCurrent: true, chamber: { jurisdiction: { code: city.jurisdiction } } } } },
    select: OFFICIAL_SELECT,
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

/** The next regular meeting, which is the one people can ask to speak at. */
export async function getNextRegularMeeting(city: CityConfig, now = new Date()): Promise<CityMeeting | null> {
  return prisma.civicEvent.findFirst({
    where: {
      jurisdiction: { code: city.jurisdiction },
      startsAt: { gte: now },
      status: "SCHEDULED",
      title: { contains: "Regular" },
    },
    orderBy: { startsAt: "asc" },
    select: MEETING_SELECT,
  });
}

export async function getUpcomingMeetings(city: CityConfig, now = new Date(), take = 4): Promise<CityMeeting[]> {
  return prisma.civicEvent.findMany({
    where: { jurisdiction: { code: city.jurisdiction }, startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    take,
    select: MEETING_SELECT,
  });
}

export async function getPastMeetings(city: CityConfig, now = new Date(), take = 12): Promise<CityMeeting[]> {
  return prisma.civicEvent.findMany({
    where: { jurisdiction: { code: city.jurisdiction }, startsAt: { lt: now } },
    orderBy: { startsAt: "desc" },
    take,
    select: MEETING_SELECT,
  });
}

/** The newest meeting whose agenda we could read, for "what they've been taking up". */
export async function getLatestTopics(city: CityConfig, now = new Date()): Promise<CityMeeting | null> {
  return prisma.civicEvent.findFirst({
    where: { jurisdiction: { code: city.jurisdiction }, startsAt: { lt: now }, items: { some: {} }, title: { contains: "Regular" } },
    orderBy: { startsAt: "desc" },
    select: MEETING_SELECT,
  });
}

/** Their ward, if they've told us. Wards aren't in the Census's answer, so it's always their choice. */
export const getUserWard = cache(async (userId: string, city: CityConfig): Promise<string | null> => {
  const row = await prisma.userLocation.findFirst({
    where: { userId, jurisdiction: { code: city.jurisdiction } },
    select: { district: { select: { code: true } } },
  });
  return row?.district?.code ?? null;
});

/** Saves their ward, or clears it with null. Returns false if this city has no such ward loaded. */
export async function saveUserWard(userId: string, city: CityConfig, regionCode: string, ward: string | null): Promise<boolean> {
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
