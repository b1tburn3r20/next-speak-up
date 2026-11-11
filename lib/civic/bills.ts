import { billLabel } from "./labels";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { fetchBillText } from "./bill-text";
import { PAGE_IDENTIFIERS } from "./people";
import { pickLatestTextVersion } from "./bill-text-logic";
import { majorityPosition } from "./alignment";
import type { BillStatusValue } from "./labels";

const PAGE_SIZE = 20;

export type BillFilters = {
  /** Federal unless it says otherwise, because state bills share the same table. */
  jurisdiction?: string;
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

/** What a bill card shows: what it's about, who's behind it, and a summary to shorten. */
export const BILL_CARD_SELECT = {
  id: true,
  slug: true,
  billType: true,
  number: true,
  title: true,
  policyArea: true,
  currentStatus: true,
  statusDate: true,
  latestActionDate: true,
  latestActionText: true,
  introducedDate: true,
  session: { select: { endDate: true } },
  summaries: {
    orderBy: [{ actionDate: "desc" }, { id: "desc" }],
    take: 1,
    select: { text: true },
  },
  sponsorships: {
    where: { kind: "SPONSOR" },
    take: 1,
    select: {
      person: {
        select: {
          fullName: true,
          imageUrl: true,
          terms: {
            orderBy: { startYear: "desc" },
            take: 1,
            select: { party: true, regionCode: true },
          },
        },
      },
    },
  },
  _count: { select: { sponsorships: { where: { kind: "COSPONSOR", withdrawnAt: null } } } },
} satisfies Prisma.BillSelect;

const LIST_SELECT = BILL_CARD_SELECT;

export type BillListItem = Prisma.BillGetPayload<{ select: typeof LIST_SELECT }>;

/** A number like "1234", or a citation like "H.R. 1234" or "hr1234". */
export function parseBillSearch(query: string): { billType?: string; number: number } | null {
  const match = query
    .trim()
    .toLowerCase()
    .replace(/[.\s]/g, "")
    .match(/^(hr|s|hjres|sjres|hconres|sconres|hres|sres|hf|sf|hcr|scr|hjr|sjr)?(\d+)$/);
  if (!match) return null;
  return { billType: match[1], number: Number.parseInt(match[2], 10) };
}

export async function listBills(filters: BillFilters = {}) {
  const limit = Math.min(filters.limit ?? PAGE_SIZE, 100);
  const where: Prisma.BillWhereInput = { jurisdiction: { code: filters.jurisdiction ?? "US" } };
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

export const listPolicyAreas = cache(async (jurisdiction = "US") => {
  const rows = await prisma.bill.findMany({
    where: { policyArea: { not: null }, jurisdiction: { code: jurisdiction } },
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
      session: { select: { identifier: true, endDate: true } },
      originChamber: { select: { shortName: true } },
      actions: {
        orderBy: [{ actionDate: "desc" }, { position: "desc" }],
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
              identifiers: PAGE_IDENTIFIERS,
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
          sourceUrl: true,
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

/** The newest text of a bill, fetched from Congress.gov on request and cached. Lists never load this, because a bill can run to megabytes. */
export const getBillText = cache(async (slug: string) => {
  const bill = await prisma.bill.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      billType: true,
      number: true,
      textVersions: {
        select: { versionType: true, issuedOn: true, htmlUrl: true, pdfUrl: true },
      },
    },
  });
  if (!bill) return null;
  const latest = pickLatestTextVersion(bill.textVersions);
  // Fetched from Congress.gov now, and cached there for a month. We don't keep a copy.
  const fetched = latest ? await fetchBillText(latest.htmlUrl) : null;
  return { bill, latest, text: fetched && "text" in fetched ? fetched.text : null, tooLarge: fetched !== null && "error" in fetched && fetched.error === "too-large" };
});

export type RollCallMemberFilters = { party?: string; position?: string; state?: string };

/** One recorded vote with every member's position, for its own page. */
export async function getRollCallDetail(
  slug: string,
  rollCallId: number,
  filters: RollCallMemberFilters = {},
) {
  const rollCall = await prisma.rollCall.findFirst({
    where: { id: rollCallId, bill: { slug } },
    select: {
      id: true,
      question: true,
      result: true,
      occurredAt: true,
      number: true,
      subSession: true,
      source: true,
      asOf: true,
      totalYea: true,
      totalNay: true,
      totalPresent: true,
      totalNotVoting: true,
      chamber: { select: { shortName: true } },
      bill: { select: { slug: true, title: true, billType: true, number: true } },
    },
  });
  if (!rollCall) return null;
  const position =
    filters.position && ["YEA", "NAY", "PRESENT", "NOT_VOTING"].includes(filters.position)
      ? (filters.position as "YEA" | "NAY" | "PRESENT" | "NOT_VOTING")
      : undefined;
  const members = await prisma.rollCallPosition.findMany({
    where: {
      rollCallId,
      ...(position ? { position } : {}),
      ...(filters.party ? { party: filters.party } : {}),
      ...(filters.state ? { regionCode: filters.state } : {}),
    },
    orderBy: [{ regionCode: "asc" }, { person: { sortName: "asc" } }],
    select: {
      position: true,
      party: true,
      regionCode: true,
      person: {
        select: {
          fullName: true,
          identifiers: PAGE_IDENTIFIERS,
        },
      },
    },
  });
  return { rollCall, members };
}

/** Which of these bills we have, with a short name for each. A bill replaced by another isn't loaded. */
export async function existingBills(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const rows = await prisma.bill.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, billType: true, number: true },
  });
  return new Map(rows.map((row) => [row.slug, billLabel(row.billType, row.number)]));
}

/** Agendas name bills like "HF 100". This finds which of them we have, in that state's current session. */
export async function findStateBills(state: { jurisdiction: string }, labels: string[]): Promise<Map<string, string>> {
  const wanted = labels.flatMap((label) => {
    const match = label.match(/^([A-Z]+) (\d+)$/);
    return match ? [{ label, billType: match[1], number: Number(match[2]) }] : [];
  });
  if (wanted.length === 0) return new Map();
  const rows = await prisma.bill.findMany({
    where: {
      jurisdiction: { code: state.jurisdiction },
      session: { isCurrent: true },
      OR: wanted.map(({ billType, number }) => ({ billType, number })),
    },
    select: { slug: true, billType: true, number: true },
  });
  const slugs = new Map(rows.map((row) => [`${row.billType} ${row.number}`, row.slug]));
  return new Map(wanted.flatMap(({ label }) => (slugs.has(label) ? [[label, slugs.get(label) as string] as const] : [])));
}

/** A bill's label and title, to start a forum post about it. Null when there's no such bill. */
export async function getBillHeadline(slug: string): Promise<{ slug: string; label: string; title: string } | null> {
  const bill = await prisma.bill.findUnique({ where: { slug }, select: { slug: true, billType: true, number: true, title: true } });
  return bill ? { slug: bill.slug, label: billLabel(bill.billType, bill.number), title: bill.title } : null;
}
