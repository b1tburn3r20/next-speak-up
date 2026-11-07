import { describe, expect, it } from "vitest";
import { billOutlook, DECIDED_STATUSES, OPEN_STATUSES } from "@/lib/civic/bill-outlook";
import { BILL_STATUS_LABELS } from "@/lib/civic/labels";
import { applyVote, celebrate, computeHud, levelFor, XP_AMOUNTS, type HudProgress } from "@/lib/civic/progress";

const base = (over: Partial<HudProgress> = {}): HudProgress => ({
  userId: "u",
  xp: 0,
  ...levelFor(over.xp ?? 0),
  streak: 0,
  votesCast: 0,
  votedToday: 0,
  dailyGoal: 3,
  ...over,
});

describe("billOutlook", () => {
  it("sorts every status as open or decided, with none left out", () => {
    const sorted = [...OPEN_STATUSES, ...DECIDED_STATUSES].sort();
    expect(sorted).toEqual(Object.keys(BILL_STATUS_LABELS).sort());
  });

  it("agrees with those lists, except a veto, which Congress could still override", () => {
    for (const status of OPEN_STATUSES) expect(billOutlook(status).kind).toBe("OPEN");
    for (const status of DECIDED_STATUSES) expect(billOutlook(status).kind).toBe("DECIDED");
    expect(billOutlook("VETOED").canInfluence).toBe(true);
  });

  it("only suggests contacting Congress when that could change something", () => {
    expect(billOutlook("IN_COMMITTEE").canInfluence).toBe(true);
    expect(billOutlook("PASSED_ORIGIN_CHAMBER").canInfluence).toBe(true);
    expect(billOutlook("BECAME_LAW").canInfluence).toBe(false);
    expect(billOutlook("FAILED").canInfluence).toBe(false);
    // Congress has finished. The President decides, so calling your rep wouldn't help.
    expect(billOutlook("TO_EXECUTIVE").canInfluence).toBe(false);
  });

  it("tells you your vote still matters on a decided bill", () => {
    expect(billOutlook("BECAME_LAW").body).toContain("still counts");
  });
});

describe("levelFor", () => {
  it("moves up every 100 XP", () => {
    expect(levelFor(0)).toEqual({ level: 1, levelPercent: 0, xpToNextLevel: 100 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toEqual({ level: 2, levelPercent: 0, xpToNextLevel: 100 });
    expect(levelFor(-5).level).toBe(1);
  });
});

describe("applyVote", () => {
  it("earns the same whichever way you vote, because it doesn't know which", () => {
    expect(applyVote(base(), 1).xp).toBe(XP_AMOUNTS.VOTE);
  });

  it("does nothing when you change your mind", () => {
    const progress = base({ xp: 50, votedToday: 1 });
    expect(applyVote(progress, 0)).toBe(progress);
  });

  it("adds the bonus once, as you reach the daily goal", () => {
    const after = applyVote(base({ votedToday: 2, xp: 20 }), 1);
    expect(after.xp).toBe(20 + XP_AMOUNTS.VOTE + XP_AMOUNTS.DAILY_GOAL);
    expect(applyVote(after, 1).xp).toBe(after.xp + XP_AMOUNTS.VOTE);
  });

  it("takes the bonus back if an undo drops you below the goal", () => {
    expect(applyVote(applyVote(base({ votedToday: 2, xp: 20 }), 1), -1).xp).toBe(20);
  });

  it("starts or continues a streak with today's first vote, and only then", () => {
    const first = applyVote(base({ streak: 4 }), 1);
    expect(first.streak).toBe(5);
    expect(applyVote(first, 1).streak).toBe(5);
    expect(applyVote(first, -1).streak).toBe(4);
  });

  it("never goes below zero", () => {
    const after = applyVote(base(), -1);
    expect(after.xp).toBe(0);
    expect(after.votesCast).toBe(0);
    expect(after.votedToday).toBe(0);
  });
});

describe("celebrate", () => {
  it("names a new level first", () => {
    expect(celebrate(base({ xp: 95, votesCast: 9 }), base({ xp: 105, votesCast: 10 }))).toBe("Level 2!");
  });

  it("notices the daily goal and badges", () => {
    expect(celebrate(base({ votedToday: 2, votesCast: 5 }), base({ votedToday: 3, votesCast: 6 }))).toBe("Daily goal met!");
    expect(celebrate(base(), base({ votesCast: 1, votedToday: 1 }))).toBe("Badge earned: First vote");
    expect(celebrate(base({ streak: 6, votesCast: 20 }), base({ streak: 7, votesCast: 21 }))).toBe("Badge earned: Full week");
  });

  it("stays quiet for an ordinary vote", () => {
    expect(celebrate(base({ votesCast: 3, votedToday: 1 }), base({ votesCast: 4, votedToday: 2 }))).toBeNull();
  });
});

describe("computeHud", () => {
  it("takes XP from the ledger rather than working it out from votes", () => {
    const now = new Date("2026-11-06T18:00:00Z");
    const hud = computeHud({ userId: "u", xp: 135, votesCast: 2, voteDates: [now], now });
    expect(hud).toMatchObject({ xp: 135, level: 2, levelPercent: 35, votedToday: 1, streak: 1, dailyGoal: 3 });
  });
});
