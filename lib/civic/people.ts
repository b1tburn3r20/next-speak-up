import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { computeMemberStats, isFinalVote, majorityPosition, type Position } from "./alignment";
import { summarizeSponsoredBills } from "./member-record";
import { STATES, stateOfScheme } from "./states";

const CURRENT_TERM = {
  where: { isCurrent: true },
  take: 1,
  select: {
    role: true,
    party: true,
    partyName: true,
    regionCode: true,
    startYear: true,
    chamber: { select: { kind: true, shortName: true, jurisdiction: { select: { code: true } } } },
    district: { select: { code: true } },
  },
} satisfies Prisma.Person$termsArgs;

/** The IDs that lead to someone's page, whichever government they're in. */
export const PAGE_IDENTIFIERS = {
  where: { scheme: { in: ["bioguide", ...STATES.map((state) => state.personScheme)] } },
  select: { scheme: true, value: true },
} satisfies Prisma.Person$identifiersArgs;

export const MEMBER_SELECT = {
  id: true,
  fullName: true,
  sortName: true,
  imageUrl: true,
  identifiers: PAGE_IDENTIFIERS,
  terms: CURRENT_TERM,
} satisfies Prisma.PersonSelect;

export type MemberCard = Prisma.PersonGetPayload<{ select: typeof MEMBER_SELECT }>;

export type MemberFilters = {
  chamber?: "UPPER" | "LOWER";
  state?: string;
  party?: string;
  q?: string;
  district?: string;
  /** Federal unless it says otherwise, because state members share the same tables. */
  jurisdiction?: string;
};

/** What `memberPath` takes: a Bioguide ID, or "ia:123" for a state legislator. */
export function memberKeyOf(person: { identifiers: { scheme?: string; value: string }[] }): string | null {
  const identifier = person.identifiers[0];
  if (!identifier) return null;
  const state = identifier.scheme ? stateOfScheme(identifier.scheme) : null;
  return state ? `${state.key}:${identifier.value}` : identifier.value;
}

function memberWhere(filters: MemberFilters): Prisma.PersonWhereInput {
  const term: Prisma.OfficeTermWhereInput = {
    isCurrent: true,
    chamber: {
      jurisdiction: { code: filters.jurisdiction ?? "US" },
      ...(filters.chamber ? { kind: filters.chamber } : {}),
    },
  };
  if (filters.state) term.regionCode = filters.state;
  if (filters.party) term.party = filters.party;
  if (filters.district) term.district = { code: filters.district };
  return {
    terms: { some: term },
    ...(filters.q ? { fullName: { contains: filters.q.trim() } } : {}),
  };
}

export async function listCurrentMembers(
  filters: MemberFilters = {},
  paging: { take?: number; skip?: number } = {},
) {
  return prisma.person.findMany({
    where: memberWhere(filters),
    select: MEMBER_SELECT,
    orderBy: { sortName: "asc" },
    ...paging,
  });
}

export async function countCurrentMembers(filters: MemberFilters = {}) {
  return prisma.person.count({ where: memberWhere(filters) });
}

/** A user's two senators and one representative. Delegates count as the representative. */
export const repsForLocation = cache(async (regionCode: string, districtCode: string | null) => {
  const reps = await prisma.person.findMany({
    where: {
      terms: {
        some: {
          isCurrent: true,
          regionCode,
          chamber: { jurisdiction: { code: "US" } },
          OR: [
            { chamber: { kind: "UPPER" } },
            ...(districtCode
              ? [{ chamber: { kind: "LOWER" as const }, district: { code: districtCode } }]
              : []),
          ],
        },
      },
    },
    select: MEMBER_SELECT,
    orderBy: { sortName: "asc" },
  });
  // The House rep first, because they're the one person who's only yours.
  const isSenator = (rep: (typeof reps)[number]) => (rep.terms[0]?.chamber.kind === "UPPER" ? 1 : 0);
  return [...reps].sort((a, b) => isSenator(a) - isSenator(b));
});

export const getMemberByBioguide = cache(async (bioguide: string) => {
  const identifier = await prisma.personIdentifier.findUnique({
    where: { scheme_value: { scheme: "bioguide", value: bioguide } },
    select: { personId: true },
  });
  if (!identifier) return null;
  return prisma.person.findUnique({
    where: { id: identifier.personId },
    include: {
      identifiers: PAGE_IDENTIFIERS,
      terms: {
        orderBy: { startYear: "desc" },
        select: {
          id: true,
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
  });
});

/**
 * Attendance and party loyalty across a member's recorded votes. The party majority per vote
 * comes from one grouped query, so it stays quick for a member with thousands of votes.
 */
export async function getMemberVotingStats(personId: number, party: string | null) {
  const own = await prisma.rollCallPosition.findMany({
    where: { personId },
    select: { rollCallId: true, position: true },
  });
  if (own.length === 0) return computeMemberStats([]);
  const groups = party
    ? await prisma.rollCallPosition.groupBy({
        by: ["rollCallId", "position"],
        where: {
          party,
          rollCallId: { in: own.map((row) => row.rollCallId) },
          position: { in: ["YEA", "NAY"] },
        },
        _count: { _all: true },
      })
    : [];
  const tallies = new Map<number, { yea: number; nay: number }>();
  for (const group of groups) {
    const tally = tallies.get(group.rollCallId) ?? { yea: 0, nay: 0 };
    if (group.position === "YEA") tally.yea = group._count._all;
    if (group.position === "NAY") tally.nay = group._count._all;
    tallies.set(group.rollCallId, tally);
  }
  return computeMemberStats(
    own.map((row) => {
      const tally = tallies.get(row.rollCallId);
      return {
        position: row.position as Position,
        partyMajority: tally ? majorityPosition(tally.yea, tally.nay) : null,
      };
    }),
  );
}

export async function getMemberRecentVotes(personId: number, take = 15, skip = 0) {
  return prisma.rollCallPosition.findMany({
    where: { personId },
    orderBy: { rollCall: { occurredAt: "desc" } },
    take,
    skip,
    select: {
      position: true,
      rollCall: {
        select: {
          id: true,
          question: true,
          result: true,
          description: true,
          legislationRef: true,
          occurredAt: true,
          source: true,
          asOf: true,
          bill: { select: { slug: true, title: true, billType: true, number: true } },
          chamber: { select: { shortName: true } },
        },
      },
    },
  });
}

export async function getMemberSponsoredBills(personId: number, take = 10) {
  const [items, sponsored, cosponsored] = await Promise.all([
    prisma.billSponsorship.findMany({
      where: { personId, kind: "SPONSOR" },
      orderBy: { bill: { latestActionDate: "desc" } },
      take,
      select: {
        bill: {
          select: {
            session: { select: { endDate: true } },
            slug: true,
            title: true,
            billType: true,
            number: true,
            currentStatus: true,
            latestActionDate: true,
          },
        },
      },
    }),
    prisma.billSponsorship.count({ where: { personId, kind: "SPONSOR" } }),
    prisma.billSponsorship.count({ where: { personId, kind: "COSPONSOR" } }),
  ]);
  return { items: items.map((item) => item.bill), sponsored, cosponsored };
}

const VOTES_PER_PAGE = 25;

/** A member's votes, one page at a time. Asks for one extra row to learn if there's a next page. */
export async function getMemberVotePage(personId: number, page: number) {
  const current = Math.max(1, page);
  const rows = await getMemberRecentVotes(personId, VOTES_PER_PAGE + 1, (current - 1) * VOTES_PER_PAGE);
  return { votes: rows.slice(0, VOTES_PER_PAGE), page: current, hasNext: rows.length > VOTES_PER_PAGE };
}

/** What a member's sponsored bills are about, and how far they got. */
export async function getMemberLegislativeRecord(personId: number) {
  const bills = await prisma.billSponsorship.findMany({
    where: { personId, kind: "SPONSOR" },
    select: { bill: { select: { policyArea: true, currentStatus: true } } },
  });
  return summarizeSponsoredBills(bills.map((row) => row.bill));
}

/** Whether this user has saved this member. */
export async function isMemberFavorite(userId: string, personId: number) {
  const row = await prisma.userPersonFavorite.findUnique({
    where: { userId_personId: { userId, personId } },
    select: { personId: true },
  });
  return row !== null;
}

export async function setMemberFavorite(userId: string, bioguide: string, favorite: boolean) {
  const person = await getMemberByBioguide(bioguide);
  if (!person) return false;
  if (favorite) {
    await prisma.userPersonFavorite.upsert({
      where: { userId_personId: { userId, personId: person.id } },
      update: {},
      create: { userId, personId: person.id },
    });
  } else {
    await prisma.userPersonFavorite.deleteMany({ where: { userId, personId: person.id } });
  }
  return true;
}

export async function listFavoriteMembers(userId: string) {
  const rows = await prisma.userPersonFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { person: { select: MEMBER_SELECT } },
  });
  return rows.map((row) => row.person);
}

/** Your reps' latest recorded votes, newest first. */
export async function getRepsRecentVotes(personIds: number[], take = 8) {
  if (personIds.length === 0) return [];
  return prisma.rollCallPosition.findMany({
    where: { personId: { in: personIds } },
    orderBy: { rollCall: { occurredAt: "desc" } },
    take,
    select: {
      position: true,
      person: { select: { fullName: true } },
      rollCall: {
        select: {
          id: true,
          question: true,
          occurredAt: true,
          legislationRef: true,
          bill: { select: { slug: true, title: true, billType: true, number: true } },
        },
      },
    },
  });
}

/** Votes on final passage, which say more about a member than procedural votes do. */
export async function getMemberKeyVotes(personId: number, take = 8) {
  const rows = await prisma.rollCallPosition.findMany({
    where: { personId, rollCall: { billId: { not: null } } },
    orderBy: { rollCall: { occurredAt: "desc" } },
    take: 150,
    select: {
      position: true,
      rollCall: {
        select: {
          id: true,
          question: true,
          occurredAt: true,
          bill: { select: { slug: true, title: true, billType: true, number: true } },
        },
      },
    },
  });
  return rows.filter((row) => isFinalVote(row.rollCall.question)).slice(0, take);
}
