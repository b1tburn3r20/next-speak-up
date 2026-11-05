import prisma from "@/prisma/client";
import {
  alignmentByPolicyArea,
  computeAlignment,
  isFinalVote,
  type ComparedVote,
  type Position,
} from "./alignment";
import { repsForLocation } from "./people";

const FEDERAL_CODE = "US";

async function federalJurisdictionId(): Promise<number> {
  const us = await prisma.jurisdiction.findUniqueOrThrow({
    where: { code: FEDERAL_CODE },
    select: { id: true },
  });
  return us.id;
}

export async function getUserLocation(userId: string) {
  const location = await prisma.userLocation.findFirst({
    where: { userId, jurisdiction: { code: FEDERAL_CODE } },
    select: {
      regionCode: true,
      source: true,
      district: { select: { code: true } },
    },
  });
  return location
    ? {
        regionCode: location.regionCode,
        districtCode: location.district?.code ?? null,
        source: location.source,
      }
    : null;
}

export type LocationSource = "BROWSER" | "ADDRESS" | "MANUAL";

/** Saves a user's state and district. Returns false if that district doesn't exist. */
export async function saveUserLocation(
  userId: string,
  regionCode: string,
  districtCode: string,
  source: LocationSource,
): Promise<boolean> {
  const district = await prisma.district.findFirst({
    where: { regionCode, code: districtCode, chamber: { kind: "LOWER" } },
    select: { id: true },
  });
  if (!district) return false;
  const jurisdictionId = await federalJurisdictionId();
  const values = { regionCode, districtId: district.id, source };
  await prisma.$transaction([
    prisma.userLocation.upsert({
      where: { userId_jurisdictionId: { userId, jurisdictionId } },
      update: values,
      create: { userId, jurisdictionId, ...values },
    }),
    // Older pages still read these two fields.
    prisma.user.update({
      where: { id: userId },
      data: {
        state: regionCode,
        district: districtCode === "AL" ? 0 : Number.parseInt(districtCode, 10),
      },
    }),
  ]);
  await refreshUserAlignment(userId);
  return true;
}

export async function listDistricts(regionCode: string): Promise<string[]> {
  const rows = await prisma.district.findMany({
    where: { regionCode, chamber: { kind: "LOWER" }, vintage: "119" },
    select: { code: true },
  });
  return rows
    .map((row) => row.code)
    .sort((a, b) => {
      const [left, right] = [Number.parseInt(a, 10), Number.parseInt(b, 10)];
      return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right);
    });
}

/**
 * Compares a user's bill votes with one person's final votes on those bills. A bill can have
 * many roll calls, so only each bill's most recent final vote in that person's chamber counts.
 */
export async function comparedVotesFor(userId: string, personId: number): Promise<ComparedVote[]> {
  const userVotes = await prisma.userBillVote.findMany({
    where: { userId },
    select: { billId: true, position: true, bill: { select: { policyArea: true } } },
  });
  if (userVotes.length === 0) return [];
  const positions = await prisma.rollCallPosition.findMany({
    where: { personId, rollCall: { billId: { in: userVotes.map((vote) => vote.billId) } } },
    select: {
      position: true,
      rollCall: { select: { billId: true, question: true, occurredAt: true } },
    },
    orderBy: { rollCall: { occurredAt: "desc" } },
  });
  const latestFinal = new Map<number, Position>();
  for (const row of positions) {
    const billId = row.rollCall.billId;
    if (billId !== null && !latestFinal.has(billId) && isFinalVote(row.rollCall.question)) {
      latestFinal.set(billId, row.position as Position);
    }
  }
  return userVotes.flatMap((vote) => {
    const repPosition = latestFinal.get(vote.billId);
    return repPosition
      ? [
          {
            userPosition: vote.position as Position,
            repPosition,
            policyArea: vote.bill.policyArea,
          },
        ]
      : [];
  });
}

/** Recalculates the stored alignment for a user's reps, so dashboards don't have to. */
export async function refreshUserAlignment(userId: string) {
  const location = await getUserLocation(userId);
  await prisma.userRepAlignment.deleteMany({ where: { userId } });
  if (!location) return;
  const reps = await repsForLocation(location.regionCode, location.districtCode);
  const rows = [];
  for (const rep of reps) {
    const compared = await comparedVotesFor(userId, rep.id);
    const overall = computeAlignment(compared);
    if (overall.compared > 0) {
      rows.push({
        userId,
        personId: rep.id,
        policyArea: "",
        comparedVotes: overall.compared,
        matchedVotes: overall.matched,
      });
    }
    for (const [policyArea, alignment] of Object.entries(alignmentByPolicyArea(compared))) {
      rows.push({
        userId,
        personId: rep.id,
        policyArea: policyArea.slice(0, 120),
        comparedVotes: alignment.compared,
        matchedVotes: alignment.matched,
      });
    }
  }
  if (rows.length > 0) await prisma.userRepAlignment.createMany({ data: rows });
}

export async function castBillVote(userId: string, slug: string, position: Position) {
  const bill = await prisma.bill.findUnique({ where: { slug }, select: { id: true } });
  if (!bill) return false;
  await prisma.userBillVote.upsert({
    where: { userId_billId: { userId, billId: bill.id } },
    update: { position },
    create: { userId, billId: bill.id, position },
  });
  await refreshUserAlignment(userId);
  return true;
}

export async function removeBillVote(userId: string, slug: string) {
  const bill = await prisma.bill.findUnique({ where: { slug }, select: { id: true } });
  if (!bill) return false;
  await prisma.userBillVote.deleteMany({ where: { userId, billId: bill.id } });
  await refreshUserAlignment(userId);
  return true;
}

export async function setBillFollow(userId: string, slug: string, following: boolean) {
  const bill = await prisma.bill.findUnique({ where: { slug }, select: { id: true } });
  if (!bill) return false;
  await prisma.userBillFollow.upsert({
    where: { userId_billId: { userId, billId: bill.id } },
    update: { following },
    create: { userId, billId: bill.id, following },
  });
  return true;
}

export async function recordBillView(userId: string, billId: number) {
  const viewedAt = new Date();
  await prisma.userBillFollow.upsert({
    where: { userId_billId: { userId, billId } },
    update: { viewedAt },
    create: { userId, billId, viewedAt },
  });
}

export async function getUserBillState(userId: string, billId: number) {
  const [vote, follow] = await Promise.all([
    prisma.userBillVote.findUnique({
      where: { userId_billId: { userId, billId } },
      select: { position: true },
    }),
    prisma.userBillFollow.findUnique({
      where: { userId_billId: { userId, billId } },
      select: { following: true },
    }),
  ]);
  return { position: vote?.position ?? null, following: follow?.following ?? false };
}

/** Weeks of activity, oldest first, with quiet weeks filled in as zero. */
export function bucketWeeks(dates: Date[], weeks: number, now = new Date()) {
  const week = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: weeks }, (_, index) => ({
    weekStart: new Date(now.getTime() - (weeks - index) * week),
    votes: 0,
  }));
  for (const date of dates) {
    const age = Math.floor((now.getTime() - date.getTime()) / week);
    if (age >= 0 && age < weeks) buckets[weeks - 1 - age].votes += 1;
  }
  return buckets;
}

export async function getUserMetrics(userId: string) {
  const [votes, following, alignments, location] = await Promise.all([
    prisma.userBillVote.findMany({
      where: { userId },
      select: { position: true, createdAt: true },
    }),
    prisma.userBillFollow.count({ where: { userId, following: true } }),
    prisma.userRepAlignment.findMany({
      where: { userId },
      select: { personId: true, policyArea: true, comparedVotes: true, matchedVotes: true },
    }),
    getUserLocation(userId),
  ]);
  const reps = location ? await repsForLocation(location.regionCode, location.districtCode) : [];
  return {
    votesCast: votes.length,
    supported: votes.filter((vote) => vote.position === "YEA").length,
    opposed: votes.filter((vote) => vote.position === "NAY").length,
    following,
    location,
    activity: bucketWeeks(
      votes.map((vote) => vote.createdAt),
      12,
    ),
    reps: reps.map((rep) => {
      const rows = alignments.filter((row) => row.personId === rep.id);
      const overall = rows.find((row) => row.policyArea === "");
      return {
        rep,
        compared: overall?.comparedVotes ?? 0,
        matched: overall?.matchedVotes ?? 0,
        percent:
          overall && overall.comparedVotes > 0
            ? Math.round((overall.matchedVotes / overall.comparedVotes) * 100)
            : null,
        byPolicyArea: rows
          .filter((row) => row.policyArea !== "")
          .map((row) => ({
            policyArea: row.policyArea,
            compared: row.comparedVotes,
            percent: Math.round((row.matchedVotes / row.comparedVotes) * 100),
          }))
          .sort((a, b) => b.compared - a.compared),
      };
    }),
  };
}
