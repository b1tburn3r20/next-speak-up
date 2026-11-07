import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { BILL_CARD_SELECT } from "./bills";
import { buildChamberBoard, easternToday, mondayOf, NEXT_MEETING, PENDING, type ChamberBoard } from "./floor-logic";

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
      ...BILL_CARD_SELECT,
      actions: {
        where: { actionCode: { in: ["8000", "9000"] } },
        select: { actionCode: true, actionDate: true },
      },
    },
  },
} satisfies Prisma.FloorScheduleItemSelect;

export type FloorItem = Prisma.FloorScheduleItemGetPayload<{ select: typeof FLOOR_SELECT }>;

const federal = (kind: "LOWER" | "UPPER"): Prisma.LegislativeChamberWhereInput => ({ kind, jurisdiction: { code: "US" } });
/** Bills on the House's list. Each chamber's meeting notice is stored here too, and isn't a bill. */
export const HOUSE_LIST: Prisma.FloorScheduleItemWhereInput = {
  chamber: federal("LOWER"),
  category: { notIn: [NEXT_MEETING, PENDING] },
};

/** Last week through whatever's been published ahead. Items taken off the schedule are left out. */
export async function getFloorSchedule(now = new Date()): Promise<FloorItem[]> {
  const from = new Date(mondayOf(easternToday(now)).getTime() - 7 * DAY_MS);
  return prisma.floorScheduleItem.findMany({
    where: { ...HOUSE_LIST, weekOf: { gte: from }, removedAt: null },
    orderBy: [{ weekOf: "asc" }, { category: "desc" }, { sortOrder: "asc" }],
    select: FLOOR_SELECT,
  });
}

/** This week and later only, for the parts of the app about what's coming up. */
export async function getUpcomingFloorItems(now = new Date()): Promise<FloorItem[]> {
  return prisma.floorScheduleItem.findMany({
    where: { ...HOUSE_LIST, weekOf: { gte: mondayOf(easternToday(now)) }, removedAt: null },
    orderBy: [{ weekOf: "asc" }, { category: "desc" }, { sortOrder: "asc" }],
    select: FLOOR_SELECT,
  });
}

export type FloorBoard = {
  house: ChamberBoard<FloorItem>;
  senate: ChamberBoard<FloorItem>;
  asOf: Date | null;
};

/** Both chambers, this week and next. Last week's rows are read for the newest Senate Calendar. */
export async function getFloorBoard(now = new Date()): Promise<FloorBoard> {
  const from = new Date(mondayOf(easternToday(now)).getTime() - 7 * DAY_MS);
  const read = (kind: "LOWER" | "UPPER") =>
    prisma.floorScheduleItem.findMany({
      where: { chamber: federal(kind), weekOf: { gte: from }, removedAt: null },
      orderBy: [{ weekOf: "asc" }, { category: "desc" }, { sortOrder: "asc" }],
      select: FLOOR_SELECT,
    });
  const [house, senate] = await Promise.all([read("LOWER"), read("UPPER")]);
  return {
    house: buildChamberBoard(house, now),
    senate: buildChamberBoard(senate, now),
    asOf: [...house, ...senate].reduce<Date | null>(
      (latest, item) => (!latest || item.asOf > latest ? item.asOf : latest),
      null,
    ),
  };
}

/** Every bill the board shows, once, for looking up what this person's done about them. */
export function floorBoardBillIds(board: FloorBoard): number[] {
  const rows = [board.house, board.senate].flatMap((chamber) => [
    ...chamber.thisWeek,
    ...chamber.nextWeek,
    ...chamber.later,
    ...chamber.waiting,
  ]);
  return [...new Set(rows.flatMap((row) => (row.bill ? [row.bill.id] : [])))];
}

export async function getBillFloorItem(billId: number, now = new Date()) {
  return prisma.floorScheduleItem.findFirst({
    where: { ...HOUSE_LIST, billId, removedAt: null, weekOf: { gte: mondayOf(easternToday(now)) } },
    orderBy: { weekOf: "asc" },
    select: {
      weekOf: true,
      category: true,
      stage: true,
      documentUrl: true,
    },
  });
}
