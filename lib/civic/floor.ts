import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { easternToday, mondayOf } from "./floor-logic";

const DAY_MS = 24 * 60 * 60 * 1000;

const FLOOR_SELECT = {
  id: true,
  weekOf: true,
  category: true,
  legislationRef: true,
  title: true,
  stage: true,
  documentUrl: true,
  sortOrder: true,
  asOf: true,
  sourceUpdatedAt: true,
  bill: {
    select: {
      id: true,
      slug: true,
      title: true,
      billType: true,
      number: true,
      currentStatus: true,
      policyArea: true,
      latestActionDate: true,
      latestActionText: true,
      actions: {
        where: { actionCode: { in: ["8000", "9000"] } },
        select: { actionCode: true, actionDate: true },
      },
    },
  },
} satisfies Prisma.FloorScheduleItemSelect;

export type FloorItem = Prisma.FloorScheduleItemGetPayload<{ select: typeof FLOOR_SELECT }>;

/** Last week through whatever's been published ahead. Items taken off the schedule are left out. */
export async function getFloorSchedule(now = new Date()): Promise<FloorItem[]> {
  const from = new Date(mondayOf(easternToday(now)).getTime() - 7 * DAY_MS);
  return prisma.floorScheduleItem.findMany({
    where: { weekOf: { gte: from }, removedAt: null },
    orderBy: [{ weekOf: "asc" }, { category: "desc" }, { sortOrder: "asc" }],
    select: FLOOR_SELECT,
  });
}

/** This week and later only, for the parts of the app about what's coming up. */
export async function getUpcomingFloorItems(now = new Date()): Promise<FloorItem[]> {
  return prisma.floorScheduleItem.findMany({
    where: { weekOf: { gte: mondayOf(easternToday(now)) }, removedAt: null },
    orderBy: [{ weekOf: "asc" }, { category: "desc" }, { sortOrder: "asc" }],
    select: FLOOR_SELECT,
  });
}

export async function getBillFloorItem(billId: number, now = new Date()) {
  return prisma.floorScheduleItem.findFirst({
    where: { billId, removedAt: null, weekOf: { gte: mondayOf(easternToday(now)) } },
    orderBy: { weekOf: "asc" },
    select: {
      weekOf: true,
      category: true,
      stage: true,
      documentUrl: true,
    },
  });
}
