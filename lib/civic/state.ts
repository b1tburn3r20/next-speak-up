import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { MEMBER_SELECT, type MemberCard } from "./people";
import { SUPPORTED_CITIES, SUPPORTED_STATES } from "./state-logic";

export const IOWA_CODE = SUPPORTED_STATES.ia.jurisdiction;
const CITY = SUPPORTED_CITIES.ia["des-moines"];

export type StateLocation = {
  upperCode: string | null;
  lowerCode: string | null;
  placeGeoid: string | null;
  city: { slug: string; name: string } | null;
};

export const getStateLocation = cache(async (userId: string): Promise<StateLocation | null> => {
  const row = await prisma.userLocation.findFirst({
    where: { userId, jurisdiction: { code: IOWA_CODE } },
    select: {
      placeGeoid: true,
      district: { select: { code: true } },
      upperDistrict: { select: { code: true } },
    },
  });
  if (!row) return null;
  return {
    lowerCode: row.district?.code ?? null,
    upperCode: row.upperDistrict?.code ?? null,
    placeGeoid: row.placeGeoid,
    city: row.placeGeoid === CITY.placeGeoid ? { slug: "des-moines", name: CITY.name } : null,
  };
});

async function iowaDistrict(kind: "UPPER" | "LOWER", code: string | null) {
  if (!code) return null;
  const row = await prisma.district.findFirst({
    where: { code, chamber: { kind, jurisdiction: { code: IOWA_CODE } } },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Saves someone's Iowa seats. Returns false if a district they named doesn't exist. */
export async function saveStateLocation(
  userId: string,
  input: { upper: string | null; lower: string | null; placeGeoid?: string | null },
  source: "BROWSER" | "ADDRESS" | "MANUAL",
): Promise<boolean> {
  const jurisdiction = await prisma.jurisdiction.findUnique({ where: { code: IOWA_CODE }, select: { id: true } });
  if (!jurisdiction) return false;
  const [upperDistrictId, districtId] = await Promise.all([
    iowaDistrict("UPPER", input.upper),
    iowaDistrict("LOWER", input.lower),
  ]);
  if ((input.upper && !upperDistrictId) || (input.lower && !districtId)) return false;
  const values = {
    regionCode: SUPPORTED_STATES.ia.code,
    districtId,
    upperDistrictId,
    source,
    ...(input.placeGeoid !== undefined ? { placeGeoid: input.placeGeoid } : {}),
  };
  await prisma.userLocation.upsert({
    where: { userId_jurisdictionId: { userId, jurisdictionId: jurisdiction.id } },
    update: values,
    create: { userId, jurisdictionId: jurisdiction.id, ...values },
  });
  return true;
}

/** Someone who moved out of Iowa shouldn't keep Iowa's legislators. */
export async function clearStateLocation(userId: string): Promise<void> {
  await prisma.userLocation.deleteMany({ where: { userId, jurisdiction: { code: IOWA_CODE } } });
}

export type StateSeat = { chamber: "UPPER" | "LOWER"; code: string | null; member: MemberCard | null };

/** Their state senator and representative. A seat with nobody in it stays, marked empty. */
export const getStateSeats = cache(async (location: StateLocation | null): Promise<StateSeat[]> => {
  if (!location) return [];
  const seat = async (chamber: "UPPER" | "LOWER", code: string | null): Promise<StateSeat> => {
    if (!code) return { chamber, code, member: null };
    const member = await prisma.person.findFirst({
      where: {
        terms: {
          some: {
            isCurrent: true,
            district: { code },
            chamber: { kind: chamber, jurisdiction: { code: IOWA_CODE } },
          },
        },
      },
      select: MEMBER_SELECT,
    });
    return { chamber, code, member };
  };
  return Promise.all([seat("LOWER", location.lowerCode), seat("UPPER", location.upperCode)]);
});

export async function getStateRepIds(userId: string): Promise<number[]> {
  const seats = await getStateSeats(await getStateLocation(userId));
  return seats.flatMap((seat) => (seat.member ? [seat.member.id] : []));
}

export const getIowaLegislator = cache(async (personId: string) => {
  const identifier = await prisma.personIdentifier.findUnique({
    where: { scheme_value: { scheme: "iowa_legis", value: personId } },
    select: {
      person: {
        select: {
          ...MEMBER_SELECT,
          phone: true,
          websiteUrl: true,
          terms: {
            where: { chamber: { jurisdiction: { code: IOWA_CODE } } },
            orderBy: [{ isCurrent: "desc" }, { startYear: "desc" }],
            take: 1,
            select: {
              role: true,
              party: true,
              partyName: true,
              regionCode: true,
              startYear: true,
              endYear: true,
              isCurrent: true,
              chamber: { select: { kind: true, shortName: true } },
              district: { select: { code: true } },
            },
          },
        },
      },
    },
  });
  return identifier?.person ?? null;
});

/** Every seat, for finding the empty ones. */
export async function getVacantSeats() {
  const districts = await prisma.district.findMany({
    where: {
      chamber: { jurisdiction: { code: IOWA_CODE } },
      terms: { none: { isCurrent: true } },
    },
    select: { code: true, chamber: { select: { kind: true, shortName: true } } },
  });
  return districts;
}

export type EventFilter = { kind?: string; when?: "upcoming" | "past"; q?: string; take?: number; skip?: number };

const EVENT_SELECT = {
  id: true,
  kind: true,
  title: true,
  startsAt: true,
  hasTime: true,
  location: true,
  joinUrl: true,
  documentUrl: true,
  agenda: true,
  status: true,
  sourceUrl: true,
  asOf: true,
  jurisdiction: { select: { code: true, name: true } },
  items: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, bill: { select: { slug: true } } } },
} satisfies Prisma.CivicEventSelect;

export type CivicEventRow = Prisma.CivicEventGetPayload<{ select: typeof EVENT_SELECT }>;

function eventWhere(jurisdictions: string[], filter: EventFilter, now: Date): Prisma.CivicEventWhereInput {
  return {
    jurisdiction: { code: { in: jurisdictions } },
    ...(filter.kind ? { kind: filter.kind as Prisma.CivicEventWhereInput["kind"] } : {}),
    ...(filter.when === "past" ? { startsAt: { lt: now } } : filter.when === "upcoming" ? { startsAt: { gte: now } } : {}),
    ...(filter.q
      ? {
          OR: [
            { title: { contains: filter.q } },
            { items: { some: { title: { contains: filter.q } } } },
          ],
        }
      : {}),
  };
}

export async function listEvents(jurisdictions: string[], filter: EventFilter = {}, now = new Date()) {
  const where = eventWhere(jurisdictions, filter, now);
  const [events, total] = await Promise.all([
    prisma.civicEvent.findMany({
      where,
      orderBy: { startsAt: filter.when === "past" ? "desc" : "asc" },
      take: filter.take ?? 25,
      skip: filter.skip ?? 0,
      select: EVENT_SELECT,
    }),
    prisma.civicEvent.count({ where }),
  ]);
  return { events, total };
}

export async function getEvent(id: number) {
  return prisma.civicEvent.findUnique({ where: { id }, select: EVENT_SELECT });
}

/** Meetings whose agenda names a bill, newest first. The feeds give the name, like "HF 100". */
export async function getBillEvents(label: string, take = 5) {
  return prisma.civicEvent.findMany({
    where: { items: { some: { title: label } } },
    orderBy: { startsAt: "desc" },
    take,
    select: EVENT_SELECT,
  });
}

/** Whether this person said they went, once per event. It's self-reported, and always shown that way. */
export async function hasReportedAttending(userId: string, eventId: number): Promise<boolean> {
  return (await prisma.civicAction.count({ where: { userId, eventId, kind: "ATTENDED_EVENT" } })) > 0;
}

export async function getIowaCounts() {
  const [bills, withVotes, laws, members] = await Promise.all([
    prisma.bill.count({ where: { jurisdiction: { code: IOWA_CODE } } }),
    prisma.rollCall.count({ where: { jurisdiction: { code: IOWA_CODE } } }),
    prisma.bill.count({ where: { jurisdiction: { code: IOWA_CODE }, currentStatus: { in: ["SIGNED", "BECAME_LAW", "VETO_OVERRIDDEN"] } } }),
    prisma.officeTerm.count({ where: { isCurrent: true, chamber: { jurisdiction: { code: IOWA_CODE } } } }),
  ]);
  return { bills, withVotes, laws, members };
}

/** For badges. Attendance is what people told us, not something we can check. */
export async function getIowaBadgeFacts(userId: string) {
  const location = await getStateLocation(userId);
  if (!location) return undefined;
  const [votes, attended, councilAttended] = await Promise.all([
    prisma.userBillVote.count({ where: { userId, bill: { jurisdiction: { code: IOWA_CODE } } } }),
    prisma.civicAction.count({ where: { userId, kind: "ATTENDED_EVENT", event: { jurisdiction: { code: IOWA_CODE } } } }),
    prisma.civicAction.count({ where: { userId, kind: "ATTENDED_EVENT", event: { kind: "COUNCIL_MEETING" } } }),
  ]);
  return { votes, attended, councilAttended, seatsFound: Boolean(location.lowerCode || location.upperCode) };
}
