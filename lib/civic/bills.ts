import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { majorityPosition } from "./alignment";
import type { BillStatusValue } from "./labels";

const PAGE_SIZE = 20;

export type BillFilters = {
  q?: string;
  status?: BillStatusValue;
  policyArea?: string;
  cursor?: string;
  limit?: number;
};

/** "2026-10-20_17": the last row's date and id, which is cheap to page from at any depth. */
export function encodeCursor(date: Date | null, id: number): string {
  return `${date ? date.toISOString().slice(0, 10) : "none"}_${id}`;
}

export function decodeCursor(cursor: string | undefined): { date: Date | null; id: number } | null {
  if (!cursor) return null;
  const [dateText, idText] = cursor.split("_");
  const id = Number.parseInt(idText ?? "", 10);
  if (Number.isNaN(id)) return null;
  if (dateText === "none") return { date: null, id };
  const date = new Date(`${dateText}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : { date, id };
}

const LIST_SELECT = {
  id: true,
  slug: true,
  billType: true,
  number: true,
  title: true,
  policyArea: true,
  currentStatus: true,
  latestActionDate: true,
  latestActionText: true,
  introducedDate: true,
} satisfies Prisma.BillSelect;

export type BillListItem = Prisma.BillGetPayload<{ select: typeof LIST_SELECT }>;

/** A number like "1234", or a citation like "H.R. 1234" or "hr1234". */
export function parseBillSearch(query: string): { billType?: string; number: number } | null {
  const match = query
    .trim()
    .toLowerCase()
    .replace(/[.\s]/g, "")
    .match(/^(hr|s|hjres|sjres|hconres|sconres|hres|sres)?(\d+)$/);
  if (!match) return null;
  return { billType: match[1], number: Number.parseInt(match[2], 10) };
}

export async function listBills(filters: BillFilters = {}) {
  const limit = Math.min(filters.limit ?? PAGE_SIZE, 100);
  const where: Prisma.BillWhereInput = {};
  if (filters.status) where.currentStatus = filters.status;
  if (filters.policyArea) where.policyArea = filters.policyArea;
  const query = filters.q?.trim();
  if (query) {
    const citation = parseBillSearch(query);
    where.OR = [
      { title: { contains: query } },
      ...(citation ? [{ number: citation.number, ...(citation.billType ? { billType: citation.billType } : {}) }] : []),
    ];
  }
  const cursor = decodeCursor(filters.cursor);
  if (cursor) {
    where.AND = [
      cursor.date
        ? {
            OR: [
              { latestActionDate: { lt: cursor.date } },
              { latestActionDate: cursor.date, id: { lt: cursor.id } },
              { latestActionDate: null },
            ],
          }
        : { latestActionDate: null, id: { lt: cursor.id } },
    ];
  }
  const rows = await prisma.bill.findMany({
    where,
    select: LIST_SELECT,
    orderBy: [{ latestActionDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const bills = hasMore ? rows.slice(0, limit) : rows;
  const last = bills[bills.length - 1];
  return {
    bills,
    nextCursor: hasMore && last ? encodeCursor(last.latestActionDate, last.id) : null,
  };
}

export const listPolicyAreas = cache(async () => {
  const rows = await prisma.bill.findMany({
    where: { policyArea: { not: null } },
    distinct: ["policyArea"],
    select: { policyArea: true },
    orderBy: { policyArea: "asc" },
  });
  return rows.map((row) => row.policyArea as string);
});

export const getBill = cache(async (slug: string) => {
  return prisma.bill.findUnique({
    where: { slug },
    include: {
      session: { select: { identifier: true } },
      originChamber: { select: { shortName: true } },
      actions: {
        orderBy: [{ actionDate: "desc" }, { id: "desc" }],
        select: {
          id: true,
          actionDate: true,
          text: true,
          type: true,
          actionCode: true,
          sourceSystem: true,
          rollCallId: true,
        },
      },
      sponsorships: {
        where: { withdrawnAt: null },
        select: {
          kind: true,
          isOriginal: true,
          person: {
            select: {
              fullName: true,
              imageUrl: true,
              identifiers: { where: { scheme: "bioguide" }, select: { value: true } },
              terms: {
                orderBy: { startYear: "desc" },
                take: 1,
                select: { party: true, regionCode: true },
              },
            },
          },
        },
      },
      summaries: { orderBy: [{ actionDate: "desc" }, { id: "desc" }] },
      textVersions: { orderBy: { issuedOn: "desc" } },
      subjects: { select: { name: true }, orderBy: { name: "asc" } },
      relations: {
        select: { relatedSlug: true, relatedTitle: true, relationType: true, relatedBillId: true },
        take: 25,
      },
      rollCalls: {
        orderBy: { occurredAt: "desc" },
        select: {
          id: true,
          question: true,
          result: true,
          occurredAt: true,
          totalYea: true,
          totalNay: true,
          totalPresent: true,
          totalNotVoting: true,
          source: true,
          asOf: true,
          number: true,
          subSession: true,
          chamber: { select: { shortName: true, kind: true } },
        },
      },
    },
  });
});

export type PartyBreakdown = {
  party: string;
  yea: number;
  nay: number;
  present: number;
  notVoting: number;
  majority: "YEA" | "NAY" | "PRESENT" | "NOT_VOTING" | null;
};

export function buildPartyBreakdown(
  rows: { party: string | null; position: string; count: number }[],
): PartyBreakdown[] {
  const groups = new Map<string, PartyBreakdown>();
  for (const row of rows) {
    const party = row.party ?? "Other";
    const group = groups.get(party) ?? {
      party,
      yea: 0,
      nay: 0,
      present: 0,
      notVoting: 0,
      majority: null,
    };
    if (row.position === "YEA") group.yea += row.count;
    else if (row.position === "NAY") group.nay += row.count;
    else if (row.position === "PRESENT") group.present += row.count;
    else if (row.position === "NOT_VOTING") group.notVoting += row.count;
    groups.set(party, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, majority: majorityPosition(group.yea, group.nay) }))
    .sort((a, b) => b.yea + b.nay - (a.yea + a.nay));
}

export async function getPartyBreakdowns(rollCallIds: number[]) {
  if (rollCallIds.length === 0) return new Map<number, PartyBreakdown[]>();
  const rows = await prisma.rollCallPosition.groupBy({
    by: ["rollCallId", "party", "position"],
    where: { rollCallId: { in: rollCallIds } },
    _count: { _all: true },
  });
  const byRollCall = new Map<number, { party: string | null; position: string; count: number }[]>();
  for (const row of rows) {
    const list = byRollCall.get(row.rollCallId) ?? [];
    list.push({ party: row.party, position: row.position, count: row._count._all });
    byRollCall.set(row.rollCallId, list);
  }
  return new Map([...byRollCall].map(([id, list]) => [id, buildPartyBreakdown(list)]));
}

/** How specific people voted on these roll calls, for showing "how your reps voted". */
export async function getPositionsFor(rollCallIds: number[], personIds: number[]) {
  if (rollCallIds.length === 0 || personIds.length === 0) return [];
  return prisma.rollCallPosition.findMany({
    where: { rollCallId: { in: rollCallIds }, personId: { in: personIds } },
    select: { rollCallId: true, personId: true, position: true },
  });
}
