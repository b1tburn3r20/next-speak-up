import { describe, expect, it } from "vitest";
import { newRank, rankFor, RANKS } from "@/lib/civic/ranks";

describe("RANKS", () => {
  it("starts at zero and only goes up, so everyone has a rank and the next is always further", () => {
    expect(RANKS[0].xp).toBe(0);
    for (let index = 1; index < RANKS.length; index += 1) {
      expect(RANKS[index].xp).toBeGreaterThan(RANKS[index - 1].xp);
    }
  });

  it("has no repeated names", () => {
    expect(new Set(RANKS.map((rank) => rank.name)).size).toBe(RANKS.length);
  });
});

describe("rankFor", () => {
  it("starts a new account at the first rank, with the goal ahead", () => {
    expect(rankFor(0)).toMatchObject({
      rank: { name: "Newcomer" },
      next: { name: "Listener", xp: 50 },
      percent: 0,
      xpToNext: 50,
      position: 1,
      votesToNext: 5,
    });
  });

  it("measures progress within this rank, not from zero", () => {
    // Listener is 50 and Neighbor is 150, so 100 XP is halfway.
    expect(rankFor(100)).toMatchObject({ rank: { name: "Listener" }, percent: 50, xpToNext: 50 });
  });

  it("reaches a rank at exactly its XP", () => {
    expect(rankFor(49).rank.name).toBe("Newcomer");
    expect(rankFor(50)).toMatchObject({ rank: { name: "Listener" }, percent: 0 });
  });

  it("rounds votes up, because a partial vote can't be cast", () => {
    expect(rankFor(45).votesToNext).toBe(1);
    expect(rankFor(41).votesToNext).toBe(1);
    expect(rankFor(39).votesToNext).toBe(2);
  });

  it("never shows a full bar before you've arrived", () => {
    expect(rankFor(149).percent).toBe(99);
  });

  it("has nothing further at the top", () => {
    expect(rankFor(5000)).toMatchObject({ rank: { name: "Statesperson" }, next: null, percent: 100, xpToNext: 0, votesToNext: 0 });
    expect(rankFor(99999).rank.name).toBe("Statesperson");
  });

  it("treats a negative number as zero", () => {
    expect(rankFor(-10).rank.name).toBe("Newcomer");
  });
});

describe("newRank", () => {
  it("names the rank you just reached", () => {
    expect(newRank(45, 55)?.name).toBe("Listener");
  });

  it("stays quiet within a rank, and when an undo drops one", () => {
    expect(newRank(55, 65)).toBeNull();
    expect(newRank(55, 45)).toBeNull();
  });
});
