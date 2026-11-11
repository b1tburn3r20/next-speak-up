// Queries behind the core loop: your rep voted, you vote, you find out. Nothing that's sent to the
// browser before someone votes may include how their rep voted, so the pulse and queue queries
// don't select positions at all. Only getBillReveal does.
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { revealOutcome, type RevealOutcome, type RevealPosition } from "./verdict";
import { HOUSE_LIST } from "./floor";
import { BILL_CARD_SELECT, type BillListItem } from "./bills";
import { OPEN_STATUSES } from "./bill-outlook";
import { easternToday, mondayOf } from "./floor-logic";
import { billLabel, roleLabel } from "./labels";
import { memberKeyOf, repsForLocation, type MemberCard } from "./people";
import { stateRoutes } from "@/lib/routes";
import { getStateLocation, getStateSeats, getUserState } from "./state";
import { stateOfSlug, type StateConfig } from "./states";
import { communitySplit, computeQuests, interleave, policyLean, type CommunitySplit, type MatchRecord } from "./engagement-logic";
import { easternMidnight, DAILY_GOAL, XP_AMOUNTS } from "./progress";
import { comparedVotesFor, getUserLocation } from "./users";
import { isComparable } from "./alignment";
import { awardContactXp } from "./xp";
import { STATE_NAMES } from "@/lib/constants/state-names";

export type QueueReason = "REP_VOTED" | "FLOOR" | "RECENT";

export type QueueItem = {
  bill: BillListItem;
  reason: QueueReason;
  /** Who voted, for "Your rep voted on this". Never how they voted. */
  reps: { name: string; imageUrl: string | null }[];
  occurredAt: Date | null;
};

const VOTED = { position: { in: ["YEA", "NAY"] } } satisfies Prisma.RollCallPositionWhereInput;

/** Bills your reps have cast a final vote on, and you haven't weighed in on. Newest first, or oldest. */
export async function getPulseItems(
  userId: string,
  repIds: number[],
  take = 5,
  billWhere: Prisma.BillWhereInput = {},
  order: "newest" | "oldest" = "newest",
): Promise<QueueItem[]> {
  if (repIds.length === 0) return [];
  // Over-fetches because a bill can have several final votes, like the House and the Senate.
  const rows = await prisma.rollCall.findMany({
    where: {
      isFinalVote: true,
      bill: { ...billWhere, userVotes: { none: { userId } } },
      positions: { some: { personId: { in: repIds }, ...VOTED } },
    },
    orderBy: { occurredAt: { sort: order === "newest" ? "desc" : "asc", nulls: "last" } },
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

/**
 * What's next in a voting session. Bills where a voice can still count come first: what's scheduled,
 * then your reps' votes on undecided bills, then undecided bills on your topics, then the rest.
 * Decided bills stay in, because they still show whether your reps represent you, but they don't lead.
 */
export async function getVoteQueue(
  userId: string | null,
  repIds: number[],
  limit = 10,
  now = new Date(),
  topics: string[] = [],
  /** Their state, if we cover it, so its bills join the queue. */
  options: { state?: StateConfig | null } = {},
): Promise<QueueItem[]> {
  const notVoted: Prisma.BillWhereInput = userId ? { userVotes: { none: { userId } } } : {};
  // A bill can't move once its session is over, whatever its last status says.
  const open: Prisma.BillWhereInput = {
    currentStatus: { in: [...OPEN_STATUSES] },
    session: { OR: [{ endDate: null }, { endDate: { gt: now } }] },
  };
  const federal: Prisma.BillWhereInput = { jurisdiction: { code: "US" } };
  const ownState: Prisma.BillWhereInput | null = options.state ? { jurisdiction: { code: options.state.jurisdiction } } : null;
  const seen = new Set<number>();
  const items: QueueItem[] = [];
  const room = () => limit - items.length;

  const push = (item: QueueItem) => {
    if (!seen.has(item.bill.id) && room() > 0) {
      seen.add(item.bill.id);
      items.push(item);
    }
  };

  const floorItems = async (): Promise<QueueItem[]> => {
    const floor = await prisma.floorScheduleItem.findMany({
      where: {
        ...HOUSE_LIST,
        weekOf: { gte: mondayOf(easternToday(now)) },
        removedAt: null,
        billId: { not: null },
        bill: notVoted,
      },
      orderBy: [{ weekOf: "asc" }, { sortOrder: "asc" }],
      take: limit,
      select: { bill: { select: BILL_CARD_SELECT } },
    });
    return floor.flatMap(({ bill }) => (bill ? [{ bill, reason: "FLOOR" as const, reps: [], occurredAt: null }] : []));
  };

  // Asks for extra, since some may already be in the queue.
  const pulseItems = (billWhere: Prisma.BillWhereInput = {}) =>
    userId ? getPulseItems(userId, repIds, limit + seen.size, billWhere) : Promise.resolve([]);

  const addRecent = async (where: Prisma.BillWhereInput, most = limit) => {
    if (room() <= 0) return;
    const recent = await prisma.bill.findMany({
      where: { ...federal, ...notVoted, id: { notIn: [...seen] }, summaries: { some: {} }, ...where },
      orderBy: [{ latestActionDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      take: Math.min(room(), most),
      select: BILL_CARD_SELECT,
    });
    for (const bill of recent) {
      seen.add(bill.id);
      items.push({ bill, reason: "RECENT", reps: [], occurredAt: null });
    }
  };

  const hasFinalVote: Prisma.BillWhereInput = { rollCalls: { some: { isFinalVote: true } } };
  // Taken in turns, because finding out how your reps voted is the point. There can be enough
  // scheduled bills to fill a whole session, which would never show a rep's vote.
  const [scheduled, repVoted] = await Promise.all([floorItems(), pulseItems(open)]);
  for (const item of interleave(scheduled, repVoted)) push(item);
  // People in a state we cover get their statehouse too, preferring bills with a vote to compare.
  if (ownState) {
    const share = Math.max(1, Math.ceil(limit / 3));
    for (const item of (await pulseItems(ownState)).slice(0, share)) push(item);
    await addRecent({ ...ownState, ...hasFinalVote }, share);
  }
  if (topics.length > 0) await addRecent({ ...open, policyArea: { in: topics } });
  // Ones with a recorded vote make the best questions, because there's something to compare.
  await addRecent({ ...open, ...hasFinalVote });
  await addRecent(open);
  if (room() > 0) for (const item of await pulseItems()) push(item);
  await addRecent(hasFinalVote);
  return items;
}

/** A state's bills to vote on: your legislators' votes first, then any with a vote to compare. */
export async function getStateVoteQueue(state: StateConfig, userId: string | null, repIds: number[], limit = 5): Promise<QueueItem[]> {
  const inState: Prisma.BillWhereInput = { jurisdiction: { code: state.jurisdiction } };
  const items = userId ? await getPulseItems(userId, repIds, limit, inState) : [];
  if (items.length >= limit) return items.slice(0, limit);
  const seen = items.map((item) => item.bill.id);
  const rest = await prisma.bill.findMany({
    where: {
      ...inState,
      id: { notIn: seen },
      rollCalls: { some: { isFinalVote: true } },
      ...(userId ? { userVotes: { none: { userId } } } : {}),
    },
    orderBy: [{ latestActionDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    take: limit - items.length,
    select: BILL_CARD_SELECT,
  });
  return [...items, ...rest.map((bill) => ({ bill, reason: "RECENT" as const, reps: [], occurredAt: null }))];
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
  phone: string | null;
  websiteUrl: string | null;
  contacted: boolean;
  /** Your record with this rep, leaving this bill out. */
  matchBase: MatchRecord;
};

/** How a user's reps voted on a bill, and whether they match. Each rep's latest final vote. */
export async function getBillReveal(userId: string, slug: string): Promise<BillReveal[] | null> {
  const bill = await prisma.bill.findUnique({
    where: { slug },
    select: { id: true, userVotes: { where: { userId }, select: { position: true } } },
  });
  if (!bill) return null;
  let reps: MemberCard[];
  const billState = stateOfSlug(slug);
  if (billState) {
    const seats = await getStateSeats(await getStateLocation(userId, billState));
    reps = seats.flatMap((seat) => (seat.member ? [seat.member] : []));
  } else {
    const location = await getUserLocation(userId);
    if (!location) return [];
    reps = await repsForLocation(location.regionCode, location.districtCode);
  }
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
  const [contacts, contactActions, compared] = await Promise.all([
    prisma.person.findMany({
      where: { id: { in: reps.map((rep) => rep.id) } },
      select: { id: true, phone: true, websiteUrl: true },
    }),
    prisma.civicAction.findMany({
      where: { userId, billId: bill.id, kind: "CONTACTED_REP" },
      select: { personId: true },
    }),
    Promise.all(reps.map((rep) => comparedVotesFor(userId, rep.id))),
  ]);
  const contactOf = new Map(contacts.map((person) => [person.id, person]));
  const contactedIds = new Set(contactActions.map((action) => action.personId));
  return reps.map((rep, index) => {
    const others = compared[index].filter((vote) => vote.billId !== bill.id && isComparable(vote));
    const row = latest.get(rep.id);
    const term = rep.terms[0];
    const position = (row?.position as RevealPosition) ?? null;
    return {
      personId: rep.id,
      name: rep.fullName,
      imageUrl: rep.imageUrl,
      bioguide: memberKeyOf(rep),
      party: term?.party ?? null,
      role: term ? roleLabel(term.role) : "",
      position,
      outcome: revealOutcome(userPosition, position),
      occurredAt: row?.rollCall.occurredAt ?? null,
      phone: contactOf.get(rep.id)?.phone ?? null,
      websiteUrl: contactOf.get(rep.id)?.websiteUrl ?? null,
      contacted: contactedIds.has(rep.id),
      matchBase: {
        matched: others.filter((vote) => vote.userPosition === vote.repPosition).length,
        compared: others.length,
      },
    };
  });
}

/** How people on Coolbills voted, shown only after you have, and only with enough votes to mean something. */
export async function getCommunitySplit(userId: string, slug: string): Promise<CommunitySplit | null> {
  const bill = await prisma.bill.findUnique({
    where: { slug },
    select: { id: true, userVotes: { where: { userId }, select: { position: true } } },
  });
  if (!bill || bill.userVotes.length === 0) return null;
  const count = async (where: Prisma.UserBillVoteWhereInput) => {
    const rows = await prisma.userBillVote.groupBy({
      by: ["position"],
      where: { billId: bill.id, position: { in: ["YEA", "NAY"] }, ...where },
      _count: { _all: true },
    });
    const of = (position: string) => rows.find((row) => row.position === position)?._count._all ?? 0;
    return { support: of("YEA"), oppose: of("NAY") };
  };
  const location = await getUserLocation(userId);
  if (location) {
    const inState = await count({ user: { locations: { some: { regionCode: location.regionCode } } } });
    const stateName = (STATE_NAMES as Record<string, string>)[location.regionCode] ?? location.regionCode;
    const split = communitySplit(`People in ${stateName} on Coolbills`, inState.support, inState.oppose);
    if (split) return split;
  }
  const everyone = await count({});
  return communitySplit("People on Coolbills", everyone.support, everyone.oppose);
}

/** Records that someone says they contacted one of their reps. Returns the XP earned, or null if it isn't their rep. */
export async function recordContact(userId: string, slug: string, personId: number): Promise<number | null> {
  const bill = await prisma.bill.findUnique({ where: { slug }, select: { id: true } });
  if (!bill) return null;
  const location = await getUserLocation(userId);
  if (!location) return null;
  const reps = await repsForLocation(location.regionCode, location.districtCode);
  if (!reps.some((rep) => rep.id === personId)) return null;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.civicAction.findFirst({
      where: { userId, billId: bill.id, personId, kind: "CONTACTED_REP" },
      select: { id: true },
    });
    if (!existing) {
      await tx.civicAction.create({ data: { userId, billId: bill.id, personId, kind: "CONTACTED_REP" } });
    }
    return awardContactXp(tx, userId, bill.id);
  });
}

export async function getPolicyLean(userId: string) {
  const votes = await prisma.userBillVote.findMany({
    where: { userId },
    select: { position: true, bill: { select: { policyArea: true } } },
  });
  return policyLean(votes.map((vote) => ({ position: vote.position, policyArea: vote.bill.policyArea })));
}

export async function getQuests(userId: string, topics: string[], now = new Date()) {
  const today = await prisma.userBillVote.findMany({
    where: { userId, createdAt: { gte: easternMidnight(now) } },
    select: { bill: { select: { currentStatus: true, policyArea: true, slug: true } } },
  });
  const state = await getUserState(userId);
  return computeQuests({
    stateVotes: state
      ? {
          name: state.name,
          href: stateRoutes(state.key).bills,
          today: today.filter(({ bill }) => bill.slug.startsWith(`${state.key}-`)).length,
        }
      : undefined,
    votedToday: today.length,
    dailyGoal: DAILY_GOAL,
    openVotesToday: today.filter(({ bill }) => (OPEN_STATUSES as readonly string[]).includes(bill.currentStatus)).length,
    topicVotesToday: today.filter(({ bill }) => bill.policyArea && topics.includes(bill.policyArea)).length,
    trackedTopics: topics.length,
    dailyGoalXp: XP_AMOUNTS.DAILY_GOAL,
  });
}

export const RECAP_DAYS = 30;

export type RepRecap = {
  votes: number;
  missed: number;
  lastChamberVote: Date | null;
  /** The bill they sponsored that moved most recently. */
  latestBill: { slug: string; title: string; label: string; date: Date | null } | null;
};

/** What each rep has done lately, and when their chamber last voted, for quiet stretches. */
export async function getRepRecaps(
  reps: { id: number; terms: { chamber: { kind: string; jurisdiction?: { code: string } } }[] }[],
  now = new Date(),
): Promise<Map<number, RepRecap>> {
  if (reps.length === 0) return new Map();
  const since = new Date(now.getTime() - RECAP_DAYS * 24 * 60 * 60 * 1000);
  const latestBills = await Promise.all(
    reps.map((rep) =>
      prisma.billSponsorship.findFirst({
        where: { personId: rep.id, kind: "SPONSOR" },
        orderBy: { bill: { latestActionDate: { sort: "desc", nulls: "last" } } },
        select: {
          bill: {
            select: { slug: true, title: true, billType: true, number: true, latestActionDate: true },
          },
        },
      }),
    ),
  );
  // Each rep's own chamber, in their own government.
  const chambers = [...new Set(reps.map((rep) => `${rep.terms[0]?.chamber.jurisdiction?.code ?? "US"}|${rep.terms[0]?.chamber.kind ?? "LOWER"}`))];
  const lastVotes = new Map(
    await Promise.all(
      chambers.map(async (key) => {
        const [code, kind] = key.split("|") as [string, "LOWER" | "UPPER"];
        const row = await prisma.rollCall.aggregate({ where: { chamber: { kind, jurisdiction: { code } } }, _max: { occurredAt: true } });
        return [key, row._max.occurredAt] as const;
      }),
    ),
  );
  const [groups] = await Promise.all([
    prisma.rollCallPosition.groupBy({
      by: ["personId", "position"],
      where: {
        personId: { in: reps.map((rep) => rep.id) },
        rollCall: { occurredAt: { gte: since } },
      },
      _count: { _all: true },
    }),
  ]);
  return new Map(
    reps.map((rep, index) => {
      const own = groups.filter((group) => group.personId === rep.id);
      const latest = latestBills[index]?.bill;
      const missed = own.find((group) => group.position === "NOT_VOTING")?._count._all ?? 0;
      const total = own.reduce((sum, group) => sum + group._count._all, 0);
      const chamberKey = `${rep.terms[0]?.chamber.jurisdiction?.code ?? "US"}|${rep.terms[0]?.chamber.kind ?? "LOWER"}`;
      return [
        rep.id,
        {
          votes: total - missed,
          missed,
          lastChamberVote: lastVotes.get(chamberKey) ?? null,
          latestBill: latest
            ? {
                slug: latest.slug,
                title: latest.title,
                label: billLabel(latest.billType, latest.number),
                date: latest.latestActionDate,
              }
            : null,
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

/** The policy areas each member has sponsored most bills in, largest first. */
export async function getSponsoredAreas(personIds: number[], perMember = 5) {
  const result = new Map<number, { policyArea: string; sponsoredCount: number; becameLawCount: number }[]>();
  if (personIds.length === 0) return result;
  const rows = await prisma.memberPolicyStat.findMany({
    where: { personId: { in: personIds }, sponsoredCount: { gt: 0 } },
    orderBy: { sponsoredCount: "desc" },
    select: { personId: true, policyArea: true, sponsoredCount: true, becameLawCount: true },
  });
  for (const { personId, ...area } of rows) {
    const areas = result.get(personId) ?? [];
    if (areas.length < perMember) areas.push(area);
    result.set(personId, areas);
  }
  return result;
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

/**
 * A pulse check on one member: the earliest bills they cast a final vote on that you haven't weighed in
 * on, in the order they voted. Like every queue, it never says how they voted.
 */
export async function getPulseCheckItems(userId: string, personId: number, take: number): Promise<QueueItem[]> {
  return getPulseItems(userId, [personId], take, {}, "oldest");
}

/**
 * For a pulse check's summary: your vote and the member's latest final vote, on the bills you voted on
 * from this run. Bills you haven't voted on are left out, so this can't reveal a vote early.
 */
export async function getPulseCheckVotes(userId: string, personId: number, slugs: string[]) {
  const votes = await prisma.userBillVote.findMany({
    where: { userId, position: { in: ["YEA", "NAY"] }, bill: { slug: { in: slugs } } },
    select: { position: true, bill: { select: { id: true, slug: true, title: true, billType: true, number: true } } },
  });
  if (votes.length === 0) return [];
  const finals = await prisma.rollCallPosition.findMany({
    where: { personId, rollCall: { isFinalVote: true, billId: { in: votes.map((vote) => vote.bill.id) } } },
    orderBy: { rollCall: { occurredAt: "desc" } },
    select: { position: true, rollCall: { select: { billId: true } } },
  });
  const latest = new Map<number, string>();
  for (const row of finals) if (row.rollCall.billId !== null && !latest.has(row.rollCall.billId)) latest.set(row.rollCall.billId, row.position);
  // In the order of the run, which is the order they were asked.
  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return votes
    .map((vote) => ({
      slug: vote.bill.slug,
      label: billLabel(vote.bill.billType, vote.bill.number),
      title: vote.bill.title,
      you: vote.position,
      them: latest.get(vote.bill.id) ?? null,
    }))
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}
