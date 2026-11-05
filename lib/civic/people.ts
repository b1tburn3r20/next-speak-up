import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { computeMemberStats, majorityPosition, type Position } from "./alignment";

const CURRENT_TERM = {
  where: { isCurrent: true },
  take: 1,
  select: {
    role: true,
    party: true,
    partyName: true,
    regionCode: true,
    startYear: true,
    chamber: { select: { kind: true, shortName: true } },
    district: { select: { code: true } },
  },
} satisfies Prisma.Person$termsArgs;

const MEMBER_SELECT = {
  id: true,
  fullName: true,
  sortName: true,
  imageUrl: true,
  identifiers: { where: { scheme: "bioguide" }, select: { value: true } },
  terms: CURRENT_TERM,
} satisfies Prisma.PersonSelect;

export type MemberCard = Prisma.PersonGetPayload<{ select: typeof MEMBER_SELECT }>;

export type MemberFilters = {
  chamber?: "UPPER" | "LOWER";
  state?: string;
  party?: string;
  q?: string;
};

export function bioguideOf(person: { identifiers: { value: string }[] }): string | null {
  return person.identifiers[0]?.value ?? null;
}

export async function listCurrentMembers(filters: MemberFilters = {}) {
  const term: Prisma.OfficeTermWhereInput = { isCurrent: true };
  if (filters.chamber) term.chamber = { kind: filters.chamber };
  if (filters.state) term.regionCode = filters.state;
  if (filters.party) term.party = filters.party;
  return prisma.person.findMany({
    where: {
      terms: { some: term },
      ...(filters.q ? { fullName: { contains: filters.q.trim() } } : {}),
    },
    select: MEMBER_SELECT,
    orderBy: { sortName: "asc" },
  });
}

/** A user's two senators and one representative. Delegates count as the representative. */
export const repsForLocation = cache(async (regionCode: string, districtCode: string | null) => {
  return prisma.person.findMany({
    where: {
      terms: {
        some: {
          isCurrent: true,
          regionCode,
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
      identifiers: { where: { scheme: "bioguide" }, select: { value: true } },
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

export async function getMemberRecentVotes(personId: number, take = 15) {
  return prisma.rollCallPosition.findMany({
    where: { personId },
    orderBy: { rollCall: { occurredAt: "desc" } },
    take,
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
