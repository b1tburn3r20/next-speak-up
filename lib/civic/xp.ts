// The XP ledger. Every reward is a row, and its unique key means repeating an action can't earn twice.
// Support and Oppose earn the same: the app never rewards a side.
import type { Prisma, XpKind } from "@prisma/client";
import prisma from "@/prisma/client";
import { easternToday, mondayOf } from "./floor-logic";
import { computeHud, dateKey, DAILY_GOAL, easternMidnight, XP_AMOUNTS, type HudProgress } from "./progress";

type Tx = Prisma.TransactionClient;

async function award(tx: Tx, userId: string, kind: XpKind, refKey: string) {
  await tx.xpEvent.createMany({
    data: [{ userId, kind, amount: XP_AMOUNTS[kind], refKey }],
    skipDuplicates: true,
  });
}

async function syncDailyGoal(tx: Tx, userId: string, now: Date) {
  const votedToday = await tx.userBillVote.count({
    where: { userId, createdAt: { gte: easternMidnight(now) } },
  });
  const refKey = dateKey(now);
  if (votedToday >= DAILY_GOAL) await award(tx, userId, "DAILY_GOAL", refKey);
  else await tx.xpEvent.deleteMany({ where: { userId, kind: "DAILY_GOAL", refKey } });
}

/** Called when a vote is first cast. Changing your mind doesn't come through here. */
export async function awardVoteXp(tx: Tx, userId: string, billId: number, now = new Date()) {
  await award(tx, userId, "VOTE", String(billId));
  const scheduled = await tx.floorScheduleItem.count({
    where: { billId, removedAt: null, weekOf: { gte: mondayOf(easternToday(now)) } },
  });
  if (scheduled > 0) await award(tx, userId, "AHEAD_OF_VOTE", String(billId));
  await syncDailyGoal(tx, userId, now);
}

/** Undoing a vote takes back what it earned, which also makes vote, undo, vote pointless. */
export async function removeVoteXp(tx: Tx, userId: string, billId: number, now = new Date()) {
  await tx.xpEvent.deleteMany({
    where: { userId, kind: { in: ["VOTE", "AHEAD_OF_VOTE"] }, refKey: String(billId) },
  });
  await syncDailyGoal(tx, userId, now);
}

/** Someone says they went to a meeting. One reward per meeting, and it's labeled self-reported. */
export async function awardAttendXp(tx: Tx, userId: string, eventId: number) {
  await award(tx, userId, "ATTENDED_EVENT", String(eventId));
}

/** Someone says they contacted a rep. One reward per bill, however many reps they contact. */
export async function awardContactXp(tx: Tx, userId: string, billId: number) {
  const refKey = String(billId);
  const before = await tx.xpEvent.count({ where: { userId, kind: "CONTACTED_REP", refKey } });
  await award(tx, userId, "CONTACTED_REP", refKey);
  return before === 0 ? XP_AMOUNTS.CONTACTED_REP : 0;
}

/** Where someone's XP came from, for the progress page. */
export async function getXpHistory(userId: string, recent = 8) {
  const [groups, latest] = await Promise.all([
    prisma.xpEvent.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.xpEvent.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: recent,
      select: { id: true, kind: true, amount: true, createdAt: true },
    }),
  ]);
  const byKind = groups
    .map((row) => ({ kind: row.kind, count: row._count._all, xp: row._sum.amount ?? 0 }))
    .sort((a, b) => b.xp - a.xp);
  return { total: byKind.reduce((sum, row) => sum + row.xp, 0), byKind, recent: latest };
}

/** Streaks only need recent votes, so this stays small however long someone has used the app. */
const STREAK_WINDOW_MS = 400 * 24 * 60 * 60 * 1000;

/**
 * For the bar on every page. It's a bonus, so a failure here hides the bar rather than breaking the
 * page, which matters because every signed-in page loads it.
 */
export async function getHudProgressSafe(userId: string): Promise<HudProgress | null> {
  try {
    return await getHudProgress(userId);
  } catch (error) {
    console.error("Couldn't load progress for the top bar", error);
    return null;
  }
}

export async function getHudProgress(userId: string, now = new Date()): Promise<HudProgress> {
  const [xp, votesCast, recent] = await Promise.all([
    prisma.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.userBillVote.count({ where: { userId } }),
    prisma.userBillVote.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - STREAK_WINDOW_MS) } },
      select: { createdAt: true },
    }),
  ]);
  return computeHud({
    userId,
    xp: xp._sum.amount ?? 0,
    votesCast,
    voteDates: recent.map((vote) => vote.createdAt),
    now,
  });
}
