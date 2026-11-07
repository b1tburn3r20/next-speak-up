// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  bill: { findMany: vi.fn(), findUnique: vi.fn() },
  userBillVote: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  rollCallPosition: { findMany: vi.fn() },
  userRepAlignment: { deleteMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
  userLocation: { findFirst: vi.fn() },
  person: { findMany: vi.fn() },
  userBillFollow: { count: vi.fn() },
  rollCall: { aggregate: vi.fn() },
  // Takes a list of operations, or a callback that receives the transaction client.
  $transaction: vi.fn((work: unknown): Promise<unknown> =>
    typeof work === "function" ? work(prismaMock) : Promise.all(work as unknown[]),
  ),
}));
vi.mock("@/prisma/client", () => ({ default: prismaMock }));
// The ledger has its own tests. This file is about votes and alignment.
vi.mock("@/lib/civic/xp", () => ({ awardVoteXp: vi.fn(), removeVoteXp: vi.fn() }));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  cache: <T,>(fn: T) => fn,
}));

import {
  buildPartyBreakdown,
  decodeCursor,
  encodeCursor,
  listBills,
  parseBillSearch,
} from "@/lib/civic/bills";
import {
  bucketWeeks,
  castBillVote,
  comparedVotesFor,
  getUserMetrics,
  refreshUserAlignment,
} from "@/lib/civic/users";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bill cursors", () => {
  it("round-trips a date and id", () => {
    const cursor = encodeCursor(new Date("2026-10-20T00:00:00Z"), 17);
    expect(cursor).toBe("2026-10-20_17");
    expect(decodeCursor(cursor)).toEqual({ date: new Date("2026-10-20T00:00:00Z"), id: 17 });
  });

  it("handles bills with no date", () => {
    expect(decodeCursor(encodeCursor(null, 5))).toEqual({ date: null, id: 5 });
  });

  it.each([undefined, "", "garbage", "2026-01-01_x", "notadate_5"])(
    "ignores a bad cursor rather than failing: %s",
    (value) => {
      expect(decodeCursor(value)).toBeNull();
    },
  );
});

describe("parseBillSearch", () => {
  it.each([
    ["H.R. 1234", { billType: "hr", number: 1234 }],
    ["hr1234", { billType: "hr", number: 1234 }],
    ["S. 5", { billType: "s", number: 5 }],
    ["H.J.Res. 7", { billType: "hjres", number: 7 }],
    ["1234", { billType: undefined, number: 1234 }],
  ])("reads %s", (query, expected) => {
    expect(parseBillSearch(query)).toEqual(expected);
  });

  it.each(["healthcare", "hr", "taxes 2026", ""])("treats %s as plain text", (query) => {
    expect(parseBillSearch(query)).toBeNull();
  });
});

describe("listBills", () => {
  const row = (id: number) => ({ id, latestActionDate: new Date("2026-01-01T00:00:00Z") });

  it("reports a next page only when there's more", async () => {
    prismaMock.bill.findMany.mockResolvedValue([row(3), row(2), row(1)]);
    const result = await listBills({ limit: 2 });
    expect(result.bills).toHaveLength(2);
    expect(result.nextCursor).toBe("2026-01-01_2");

    prismaMock.bill.findMany.mockResolvedValue([row(2), row(1)]);
    expect((await listBills({ limit: 2 })).nextCursor).toBeNull();
  });

  it("caps the page size", async () => {
    prismaMock.bill.findMany.mockResolvedValue([]);
    await listBills({ limit: 100000 });
    expect(prismaMock.bill.findMany.mock.calls[0][0].take).toBe(101);
  });

  it("searches a citation by bill number as well as title", async () => {
    prismaMock.bill.findMany.mockResolvedValue([]);
    await listBills({ q: "H.R. 1" });
    expect(prismaMock.bill.findMany.mock.calls[0][0].where.OR).toEqual([
      { title: { contains: "H.R. 1" } },
      { number: 1, billType: "hr" },
    ]);
  });
});

describe("buildPartyBreakdown", () => {
  it("adds up each party and finds its majority", () => {
    const result = buildPartyBreakdown([
      { party: "D", position: "YEA", count: 200 },
      { party: "D", position: "NAY", count: 10 },
      { party: "D", position: "NOT_VOTING", count: 3 },
      { party: "R", position: "NAY", count: 220 },
      { party: "R", position: "PRESENT", count: 1 },
    ]);
    expect(result[0]).toEqual({
      party: "R",
      yea: 0,
      nay: 220,
      present: 1,
      notVoting: 0,
      majority: "NAY",
    });
    expect(result[1].majority).toBe("YEA");
    expect(result[1].notVoting).toBe(3);
  });

  it("doesn't drop members with no recorded party", () => {
    const result = buildPartyBreakdown([{ party: null, position: "YEA", count: 1 }]);
    expect(result[0].party).toBe("Other");
  });
});

describe("comparedVotesFor", () => {
  const userVote = (billId: number, position: string, policyArea = "Taxation") => ({
    billId,
    position,
    bill: { policyArea },
  });
  const repVote = (billId: number, position: string, question: string) => ({
    position,
    rollCall: { billId, question, occurredAt: new Date() },
  });

  it("uses only the rep's latest final vote, not procedural steps", async () => {
    prismaMock.userBillVote.findMany.mockResolvedValue([userVote(1, "YEA")]);
    prismaMock.rollCallPosition.findMany.mockResolvedValue([
      repVote(1, "NAY", "On Motion to Table"),
      repVote(1, "YEA", "On Passage"),
      repVote(1, "NAY", "On Passage"),
    ]);
    const result = await comparedVotesFor("u1", 9);
    expect(result).toEqual([
      { userPosition: "YEA", repPosition: "YEA", policyArea: "Taxation" },
    ]);
  });

  it("skips bills the rep never had a final vote on", async () => {
    prismaMock.userBillVote.findMany.mockResolvedValue([userVote(1, "YEA")]);
    prismaMock.rollCallPosition.findMany.mockResolvedValue([
      repVote(1, "YEA", "On Motion to Table"),
    ]);
    expect(await comparedVotesFor("u1", 9)).toEqual([]);
  });

  it("makes no vote query for a user with no votes", async () => {
    prismaMock.userBillVote.findMany.mockResolvedValue([]);
    expect(await comparedVotesFor("u1", 9)).toEqual([]);
    expect(prismaMock.rollCallPosition.findMany).not.toHaveBeenCalled();
  });
});

describe("castBillVote", () => {
  it("refuses a bill that doesn't exist", async () => {
    prismaMock.bill.findUnique.mockResolvedValue(null);
    expect(await castBillVote("u1", "us-119-hr-999999", "YEA")).toBe(false);
    expect(prismaMock.userBillVote.upsert).not.toHaveBeenCalled();
  });

  it("saves the vote, then refreshes alignment", async () => {
    prismaMock.bill.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.userLocation.findFirst.mockResolvedValue(null);
    expect(await castBillVote("u1", "us-119-hr-1", "NAY")).toBe(true);
    expect(prismaMock.userBillVote.upsert).toHaveBeenCalledOnce();
    expect(prismaMock.userRepAlignment.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
  });
});

describe("bucketWeeks", () => {
  const now = new Date("2026-11-05T00:00:00Z");
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it("puts recent votes last and fills quiet weeks with zero", () => {
    const buckets = bucketWeeks([daysAgo(1), daysAgo(2), daysAgo(10)], 4, now);
    expect(buckets.map((bucket) => bucket.votes)).toEqual([0, 0, 1, 2]);
  });

  it("ignores votes outside the window", () => {
    expect(bucketWeeks([daysAgo(365)], 4, now).every((bucket) => bucket.votes === 0)).toBe(true);
  });
});

describe("stored alignment", () => {
  const OLD = new Date("2026-01-01T00:00:00Z");
  const NEW = new Date("2026-06-01T00:00:00Z");

  beforeEach(() => {
    prismaMock.userBillFollow.count.mockResolvedValue(0);
    prismaMock.userLocation.findFirst.mockResolvedValue(null);
    prismaMock.userBillVote.findMany.mockResolvedValue([{ position: "YEA", createdAt: NEW }]);
    prismaMock.userRepAlignment.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.userRepAlignment.createMany.mockResolvedValue({ count: 0 });
  });

  it("refreshes when the pipeline has loaded newer votes", async () => {
    prismaMock.userRepAlignment.findMany.mockResolvedValue([{ updatedAt: OLD }]);
    prismaMock.rollCall.aggregate.mockResolvedValue({ _max: { updatedAt: NEW } });
    await getUserMetrics("u1");
    await vi.waitFor(() => expect(prismaMock.userRepAlignment.deleteMany).toHaveBeenCalled());
  });

  it("leaves fresh numbers alone", async () => {
    prismaMock.userRepAlignment.findMany.mockResolvedValue([{ updatedAt: NEW }]);
    prismaMock.rollCall.aggregate.mockResolvedValue({ _max: { updatedAt: OLD } });
    await getUserMetrics("u1");
    expect(prismaMock.userRepAlignment.deleteMany).not.toHaveBeenCalled();
  });

  it("doesn't recalculate for someone who hasn't voted", async () => {
    prismaMock.userBillVote.findMany.mockResolvedValue([]);
    prismaMock.userRepAlignment.findMany.mockResolvedValue([]);
    await getUserMetrics("u1");
    expect(prismaMock.userRepAlignment.deleteMany).not.toHaveBeenCalled();
  });

  it("still shows the dashboard if a refresh fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    prismaMock.userRepAlignment.findMany.mockResolvedValue([{ updatedAt: OLD }]);
    prismaMock.rollCall.aggregate.mockResolvedValue({ _max: { updatedAt: NEW } });
    prismaMock.userRepAlignment.deleteMany.mockRejectedValueOnce(new Error("Deadlock"));
    await expect(getUserMetrics("u1")).resolves.toMatchObject({ votesCast: 1 });
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
  });

  it("replaces rows in one step, tolerating an overlapping refresh", async () => {
    prismaMock.userLocation.findFirst.mockResolvedValue({
      regionCode: "WY",
      district: { code: "AL" },
    });
    prismaMock.person.findMany.mockResolvedValue([]);
    await refreshUserAlignment("u1");
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.userRepAlignment.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
});
