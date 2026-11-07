// Queries for state and local government. Every one takes the state it's about, from lib/civic/states.ts.
import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { MEMBER_SELECT, type MemberCard } from "./people";
import { cityByGeoid, eventJurisdictions, stateByRegion, STATES, type ChamberKind, type CityConfig, type StateConfig } from "./states";
import { getUserLocation } from "./users";

export type StateLocation = {
  state: StateConfig;
  upperCode: string | null;
  lowerCode: string | null;
  placeGeoid: string | null;
  city: CityConfig | null;
};

/** The state someone lives in, if it's one we cover. Their federal location is what says where they are. */
export const getUserState = cache(async (userId: string): Promise<StateConfig | null> => {
  return stateByRegion((await getUserLocation(userId))?.regionCode);
});

export const getStateLocation = cache(async (userId: string, state: StateConfig): Promise<StateLocation | null> => {
  const row = await prisma.userLocation.findFirst({
    where: { userId, jurisdiction: { code: state.jurisdiction } },
    select: {
      placeGeoid: true,
      district: { select: { code: true } },
      upperDistrict: { select: { code: true } },
    },
  });
  if (!row) return null;
  return {
    state,
    lowerCode: row.district?.code ?? null,
    upperCode: row.upperDistrict?.code ?? null,
    placeGeoid: row.placeGeoid,
    city: cityByGeoid(state, row.placeGeoid),
  };
});

/** Their state, and where in it, in one step. */
export async function getUserStateLocation(userId: string): Promise<StateLocation | null> {
  const state = await getUserState(userId);
  return state ? getStateLocation(userId, state) : null;
}

async function stateDistrict(state: StateConfig, kind: ChamberKind, code: string | null) {
  if (!code) return null;
  const row = await prisma.district.findFirst({
    where: { code, chamber: { kind, jurisdiction: { code: state.jurisdiction } } },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Saves someone's seats in a state. Returns false if a district they named doesn't exist. */
export async function saveStateLocation(
  userId: string,
  state: StateConfig,
  input: { upper: string | null; lower: string | null; placeGeoid?: string | null },
  source: "BROWSER" | "ADDRESS" | "MANUAL",
): Promise<boolean> {
  const jurisdiction = await prisma.jurisdiction.findUnique({ where: { code: state.jurisdiction }, select: { id: true } });
  if (!jurisdiction) return false;
  const [upperDistrictId, districtId] = await Promise.all([
    stateDistrict(state, "UPPER", input.upper),
    stateDistrict(state, "LOWER", input.lower),
  ]);
  if ((input.upper && !upperDistrictId) || (input.lower && !districtId)) return false;
  const values = {
    regionCode: state.regionCode,
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

/** Someone who moves keeps only the state they're in now, so nobody keeps another state's legislators. */
export async function clearOtherStateLocations(userId: string, regionCode: string): Promise<void> {
  const others = STATES.filter((state) => state.regionCode !== regionCode).map((state) => state.jurisdiction);
  if (others.length === 0) return;
  await prisma.userLocation.deleteMany({ where: { userId, jurisdiction: { code: { in: others } } } });
}

export type StateSeat = { chamber: ChamberKind; code: string | null; member: MemberCard | null };

/** Their state senator and representative. A seat with nobody in it stays, marked empty. */
export const getStateSeats = cache(async (location: StateLocation | null): Promise<StateSeat[]> => {
  if (!location) return [];
  const seat = async (chamber: ChamberKind, code: string | null): Promise<StateSeat> => {
    if (!code) return { chamber, code, member: null };
    const member = await prisma.person.findFirst({
      where: {
        terms: {
          some: {
            isCurrent: true,
            district: { code },
            chamber: { kind: chamber, jurisdiction: { code: location.state.jurisdiction } },
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
  const seats = await getStateSeats(await getUserStateLocation(userId));
  return seats.flatMap((seat) => (seat.member ? [seat.member.id] : []));
}

export const getStateLegislator = cache(async (state: StateConfig, personId: string) => {
  const identifier = await prisma.personIdentifier.findUnique({
    where: { scheme_value: { scheme: state.personScheme, value: personId } },
    select: {
      person: {
        select: {
          ...MEMBER_SELECT,
          phone: true,
          websiteUrl: true,
          terms: {
            where: { chamber: { jurisdiction: { code: state.jurisdiction } } },
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
              chamber: { select: { kind: true, shortName: true, jurisdiction: { select: { code: true } } } },
              district: { select: { code: true } },
            },
          },
        },
      },
    },
  });
  return identifier?.person ?? null;
});

/** Seats nobody is sitting in. */
export async function getVacantSeats(state: StateConfig) {
  return prisma.district.findMany({
    where: { chamber: { jurisdiction: { code: state.jurisdiction } }, terms: { none: { isCurrent: true } } },
    select: { code: true, chamber: { select: { kind: true, shortName: true } } },
  });
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
      ? { OR: [{ title: { contains: filter.q } }, { items: { some: { title: { contains: filter.q } } } }] }
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

/** One meeting, only if it belongs to this state or one of its cities. */
export async function getEvent(state: StateConfig, id: number) {
  return prisma.civicEvent.findFirst({
    where: { id, jurisdiction: { code: { in: eventJurisdictions(state) } } },
    select: EVENT_SELECT,
  });
}

/** Meetings whose agenda names a bill, newest first. The feeds give the name, like "HF 100". */
export async function getBillEvents(state: StateConfig, label: string, take = 5) {
  return prisma.civicEvent.findMany({
    where: { jurisdiction: { code: { in: eventJurisdictions(state) } }, items: { some: { title: label } } },
    orderBy: { startsAt: "desc" },
    take,
    select: EVENT_SELECT,
  });
}

/** Whether this person said they went, once per event. It's self-reported, and always shown that way. */
export async function hasReportedAttending(userId: string, eventId: number): Promise<boolean> {
  return (await prisma.civicAction.count({ where: { userId, eventId, kind: "ATTENDED_EVENT" } })) > 0;
}

export async function getStateCounts(state: StateConfig) {
  const code = state.jurisdiction;
  const [bills, rollCalls, laws, members] = await Promise.all([
    prisma.bill.count({ where: { jurisdiction: { code } } }),
    prisma.rollCall.count({ where: { jurisdiction: { code } } }),
    prisma.bill.count({ where: { jurisdiction: { code }, currentStatus: { in: ["SIGNED", "BECAME_LAW", "VETO_OVERRIDDEN"] } } }),
    prisma.officeTerm.count({ where: { isCurrent: true, chamber: { jurisdiction: { code } } } }),
  ]);
  return { bills, rollCalls, laws, members };
}

/** For badges. Attendance is what people told us, not something we can check. */
export async function getStateBadgeFacts(userId: string) {
  const location = await getUserStateLocation(userId);
  if (!location) return undefined;
  const { state } = location;
  const cities = state.cities.map((city) => city.jurisdiction);
  const [votes, attended, cityAttended] = await Promise.all([
    prisma.userBillVote.count({ where: { userId, bill: { jurisdiction: { code: state.jurisdiction } } } }),
    prisma.civicAction.count({ where: { userId, kind: "ATTENDED_EVENT", event: { jurisdiction: { code: state.jurisdiction } } } }),
    prisma.civicAction.count({ where: { userId, kind: "ATTENDED_EVENT", event: { jurisdiction: { code: { in: cities } } } } }),
  ]);
  return {
    stateName: state.name,
    votes,
    attended,
    cityAttended,
    seatsFound: Boolean(location.lowerCode || location.upperCode),
  };
}
