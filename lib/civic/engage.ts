// Queries behind the core loop: your rep voted, you vote, you find out. Nothing that's sent to the
// browser before someone votes may include how their rep voted, so the pulse and queue queries
// don't select positions at all. Only getBillReveal does.
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { revealOutcome, type RevealOutcome, type RevealPosition } from "./verdict";
import { BILL_CARD_SELECT, type BillListItem } from "./bills";
import { easternToday, mondayOf } from "./floor-logic";
import { roleLabel } from "./labels";
import { bioguideOf, repsForLocation } from "./people";
import { getUserLocation } from "./users";

export type QueueReason = "REP_VOTED" | "FLOOR" | "RECENT";

export type QueueItem = {
  bill: BillListItem;
  reason: QueueReason;
  /** Who voted, for "Your rep voted on this". Never how they voted. */
  reps: { name: string; imageUrl: string | null }[];
  occurredAt: Date | null;
};

const VOTED = { position: { in: ["YEA", "NAY"] } } satisfies Prisma.RollCallPositionWhereInput;

/** Bills your reps have cast a final vote on, and you haven't weighed in on. Newest first. */
export async function getPulseItems(userId: string, repIds: number[], take = 5): Promise<QueueItem[]> {
  if (repIds.length === 0) return [];
  // Over-fetches because a bill can have several final votes, like the House and the Senate.
  const rows = await prisma.rollCall.findMany({
    where: {
      isFinalVote: true,
      bill: { userVotes: { none: { userId } } },
      positions: { some: { personId: { in: repIds }, ...VOTED } },
    },
    orderBy: { occurredAt: { sort: "desc", nulls: "last" } },
    take: take * 4,
    select: {
      occurredAt: true,
      bill: { select: BILL_CARD_SELECT },
      positions: {
        where: { personId: { in: repIds }, ...VOTED },
        select: { person: { select: { fullName: true, imageUrl: true } } },
      },
    },
  });
  const seen = new Set<number>();
  const items: QueueItem[] = [];
  for (const row of rows) {
    if (!row.bill || seen.has(row.bill.id)) continue;
    seen.add(row.bill.id);
    items.push({
      bill: row.bill,
      reason: "REP_VOTED",
      occurredAt: row.occurredAt,
      reps: row.positions.map(({ person }) => ({
        name: person.fullName,
        imageUrl: person.imageUrl,
      })),
    });
    if (items.length === take) break;
  }
  return items;
}

export async function countPulse(userId: string, repIds: number[]): Promise<number> {
  if (repIds.length === 0) return 0;
  return prisma.bill.count({
    where: {
      userVotes: { none: { userId } },
      rollCalls: {
        some: {
          isFinalVote: true,
          positions: { some: { personId: { in: repIds }, ...VOTED } },
        },
      },
    },
  });
}

/** What's next in a voting session: your reps' votes, then upcoming bills, then recent ones. */
export async function getVoteQueue(
  userId: string | null,
  repIds: number[],
  limit = 10,
  now = new Date(),
): Promise<QueueItem[]> {
  const notVoted: Prisma.BillWhereInput = userId ? { userVotes: { none: { userId } } } : {};
  const pulse = userId ? await getPulseItems(userId, repIds, limit) : [];
  const seen = new Set(pulse.map((item) => item.bill.id));
  const items = [...pulse];

  if (items.length < limit) {
    const floor = await prisma.floorScheduleItem.findMany({
      where: {
        weekOf: { gte: mondayOf(easternToday(now)) },
        removedAt: null,
        billId: { not: null },
        bill: notVoted,
      },
      orderBy: [{ weekOf: "asc" }, { sortOrder: "asc" }],
      take: limit,
      select: { bill: { select: BILL_CARD_SELECT } },
    });
    for (const { bill } of floor) {
      if (bill && !seen.has(bill.id) && items.length < limit) {
        seen.add(bill.id);
        items.push({ bill, reason: "FLOOR", reps: [], occurredAt: null });
      }
    }
  }

  if (items.length < limit) {
    // Bills with a recorded vote and a summary make the best questions.
    const recent = await prisma.bill.findMany({
      where: {
        ...notVoted,
        id: { notIn: [...seen] },
        summaries: { some: {} },
        rollCalls: { some: { isFinalVote: true } },
      },
      orderBy: [{ latestActionDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      take: limit - items.length,
      select: BILL_CARD_SELECT,
    });
    for (const bill of recent) {
      items.push({ bill, reason: "RECENT", reps: [], occurredAt: null });
    }
  }
  return items;
}

export type BillReveal = {
  personId: number;
  name: string;
  imageUrl: string | null;
  bioguide: string | null;
  party: string | null;
  role: string;
  position: RevealPosition;
  outcome: RevealOutcome;
  occurredAt: Date | null;
};

/** How a user's reps voted on a bill, and whether they match. Each rep's latest final vote. */
export async function getBillReveal(userId: string, slug: string): Promise<BillReveal[] | null> {
  const bill = await prisma.bill.findUnique({
    where: { slug },
    select: { id: true, userVotes: { where: { userId }, select: { position: true } } },
  });
  if (!bill) return null;
  const location = await getUserLocation(userId);
  if (!location) return [];
  const reps = await repsForLocation(location.regionCode, location.districtCode);
  if (reps.length === 0) return [];
  const positions = await prisma.rollCallPosition.findMany({
    where: {
      personId: { in: reps.map((rep) => rep.id) },
      rollCall: { billId: bill.id, isFinalVote: true },
    },
    orderBy: { rollCall: { occurredAt: "desc" } },
    select: { personId: true, position: true, rollCall: { select: { occurredAt: true } } },
  });
  const latest = new Map<number, (typeof positions)[number]>();
  for (const row of positions) {
    if (!latest.has(row.personId)) latest.set(row.personId, row);
  }
  const userPosition = bill.userVotes[0]?.position ?? null;
  return reps.map((rep) => {
    const row = latest.get(rep.id);
    const term = rep.terms[0];
    const position = (row?.position as RevealPosition) ?? null;
    return {
      personId: rep.id,
      name: rep.fullName,
      imageUrl: rep.imageUrl,
      bioguide: bioguideOf(rep),
      party: term?.party ?? null,
      role: term ? roleLabel(term.role) : "",
      position,
      outcome: revealOutcome(userPosition, position),
      occurredAt: row?.rollCall.occurredAt ?? null,
    };
  });
}

export const RECAP_DAYS = 30;

export type RepRecap = { votes: number; missed: number; lastChamberVote: Date | null };

/** What each rep has done lately, and when their chamber last voted, for quiet stretches. */
export async function getRepRecaps(
  reps: { id: number; terms: { chamber: { kind: string } }[] }[],
  now = new Date(),
): Promise<Map<number, RepRecap>> {
  if (reps.length === 0) return new Map();
  const since = new Date(now.getTime() - RECAP_DAYS * 24 * 60 * 60 * 1000);
  const [groups, house, senate] = await Promise.all([
    prisma.rollCallPosition.groupBy({
      by: ["personId", "position"],
      where: {
        personId: { in: reps.map((rep) => rep.id) },
        rollCall: { occurredAt: { gte: since } },
      },
      _count: { _all: true },
    }),
    prisma.rollCall.aggregate({
      where: { chamber: { kind: "LOWER" } },
      _max: { occurredAt: true },
    }),
    prisma.rollCall.aggregate({
      where: { chamber: { kind: "UPPER" } },
      _max: { occurredAt: true },
    }),
  ]);
  return new Map(
    reps.map((rep) => {
      const own = groups.filter((group) => group.personId === rep.id);
      const missed = own.find((group) => group.position === "NOT_VOTING")?._count._all ?? 0;
      const total = own.reduce((sum, group) => sum + group._count._all, 0);
      const kind = rep.terms[0]?.chamber.kind;
      return [
        rep.id,
        {
          votes: total - missed,
          missed,
          lastChamberVote: (kind === "UPPER" ? senate : house)._max.occurredAt,
        },
      ];
    }),
  );
}

/** Rollups for a list of people. One query, however many people. */
export async function getMemberStats(personIds: number[]) {
  if (personIds.length === 0) return new Map();
  const rows = await prisma.memberStat.findMany({ where: { personId: { in: personIds } } });
  return new Map(rows.map((row) => [row.personId, row]));
}

/** Sponsored bills and final votes by policy area, largest first. */
export async function getMemberPolicyStats(personId: number) {
  return prisma.memberPolicyStat.findMany({
    where: { personId },
    orderBy: { sponsoredCount: "desc" },
    select: {
      policyArea: true,
      sponsoredCount: true,
      becameLawCount: true,
      yeaVotes: true,
      nayVotes: true,
    },
  });
}

/** What the progress, next step, and badge displays need. */
export async function getEngagementFacts(userId: string, repIds: number[]) {
  const [votes, followingCount, pulseCount, alignments] = await Promise.all([
    prisma.userBillVote.findMany({
      where: { userId },
      select: {
        createdAt: true,
        bill: { select: { policyArea: true, floorItems: { take: 1, select: { id: true } } } },
      },
    }),
    prisma.userBillFollow.count({ where: { userId, following: true } }),
    countPulse(userId, repIds),
    prisma.userRepAlignment.findMany({
      where: { userId, policyArea: "" },
      select: { personId: true, comparedVotes: true },
    }),
  ]);
  const compared = repIds.map(
    (id) => alignments.find((row) => row.personId === id)?.comparedVotes ?? 0,
  );
  return {
    voteDates: votes.map((vote) => vote.createdAt),
    floorVotes: votes.filter((vote) => vote.bill.floorItems.length > 0).length,
    policyAreasVoted: new Set(votes.flatMap((vote) => vote.bill.policyArea ?? [])).size,
    followingCount,
    pulseCount,
    fewestComparedWithRep: compared.length > 0 ? Math.min(...compared) : 0,
    mostComparedWithRep: compared.length > 0 ? Math.max(...compared) : 0,
  };
}
