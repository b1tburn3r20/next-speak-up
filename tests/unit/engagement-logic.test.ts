import { describe, expect, it } from "vitest";
import {
  communitySplit,
  computeQuests,
  interleave,
  leanChanges,
  matchMove,
  MIN_SPLIT_VOTES,
  policyLean,
  weekStart,
} from "@/lib/civic/engagement-logic";
import { easternMidnight } from "@/lib/civic/progress";

describe("policyLean", () => {
  it("counts by topic, busiest first, and ignores bills with no topic and non-votes", () => {
    const rows = policyLean([
      { position: "YEA", policyArea: "Health" },
      { position: "NAY", policyArea: "Health" },
      { position: "YEA", policyArea: "Health" },
      { position: "YEA", policyArea: "Taxation" },
      { position: "YEA", policyArea: null },
      { position: "PRESENT", policyArea: "Taxation" },
    ]);
    expect(rows).toEqual([
      { area: "Health", support: 2, oppose: 1 },
      { area: "Taxation", support: 1, oppose: 0 },
    ]);
  });

  it("keeps to the limit", () => {
    const votes = Array.from({ length: 12 }, (_, i) => ({ position: "YEA", policyArea: `Area ${i}` }));
    expect(policyLean(votes, 5)).toHaveLength(5);
  });
});

describe("leanChanges", () => {
  it("shows what went up and down, counting a new topic from zero", () => {
    const changes = leanChanges(
      [{ area: "Health", support: 2, oppose: 3 }],
      [
        { area: "Health", support: 3, oppose: 2 },
        { area: "Taxation", support: 1, oppose: 0 },
      ],
    );
    expect(changes.get("Health")).toEqual({ support: 1, oppose: -1 });
    expect(changes.get("Taxation")).toEqual({ support: 1, oppose: 0 });
  });
});

describe("interleave", () => {
  it("takes turns, then finishes whichever list is longer", () => {
    expect(interleave<number | string>([1, 2, 3], ["a"])).toEqual([1, "a", 2, 3]);
    expect(interleave<number | string>([1], ["a", "b", "c"])).toEqual([1, "a", "b", "c"]);
    expect(interleave([], ["a"])).toEqual(["a"]);
  });
});

describe("computeQuests", () => {
  const base = { votedToday: 0, dailyGoal: 3, openVotesToday: 0, topicVotesToday: 0, trackedTopics: 2, dailyGoalXp: 20 };

  it("offers three, and only the goal carries bonus XP", () => {
    const quests = computeQuests(base);
    expect(quests).toHaveLength(3);
    expect(quests.map((quest) => quest.bonusXp)).toEqual([20, undefined, undefined]);
  });

  it("marks what's done, and caps progress at the goal", () => {
    const [goal, open] = computeQuests({ ...base, votedToday: 5, openVotesToday: 1 });
    expect(goal).toMatchObject({ current: 3, goal: 3, done: true });
    expect(open.done).toBe(true);
  });

  it("asks someone with no topics to pick one", () => {
    expect(computeQuests({ ...base, trackedTopics: 0 })[2].id).toBe("pick-topics");
    expect(computeQuests(base)[2].id).toBe("your-topic");
  });
});

describe("communitySplit", () => {
  it("stays hidden below the minimum, so it can't point to individual people", () => {
    expect(communitySplit("x", MIN_SPLIT_VOTES - 1, 0)).toBeNull();
    expect(communitySplit("x", 15, 5)).toEqual({ label: "x", supportPercent: 75, total: 20 });
  });
});

describe("matchMove", () => {
  it("moves up on a match and down on a difference", () => {
    const base = { matched: 1, compared: 2 };
    expect(matchMove(base, "YEA", "YEA")).toEqual({ before: 50, after: 67, counted: true });
    expect(matchMove(base, "YEA", "NAY")).toEqual({ before: 50, after: 33, counted: true });
  });

  it("doesn't count a rep who didn't vote, or a vote you haven't cast", () => {
    const base = { matched: 1, compared: 2 };
    expect(matchMove(base, "YEA", "NOT_VOTING").counted).toBe(false);
    expect(matchMove(base, "YEA", null).counted).toBe(false);
    expect(matchMove(base, null, "YEA").counted).toBe(false);
  });

  it("has no before on the first vote you can compare", () => {
    expect(matchMove({ matched: 0, compared: 0 }, "YEA", "YEA")).toEqual({ before: null, after: 100, counted: true });
  });
});

describe("weekStart", () => {
  it("is Monday midnight in Eastern time", () => {
    // Friday, Nov 6, 2026, when Eastern is UTC-5.
    expect(weekStart(new Date("2026-11-06T18:00:00Z")).toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("treats Sunday as the end of the week, not the start", () => {
    expect(weekStart(new Date("2026-11-08T18:00:00Z")).toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("uses the summer offset in summer", () => {
    expect(weekStart(new Date("2026-07-15T18:00:00Z")).toISOString()).toBe("2026-07-13T04:00:00.000Z");
  });

  it("still counts late Sunday night in Eastern as the old week", () => {
    expect(weekStart(new Date("2026-11-09T03:00:00Z")).toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });
});

describe("easternMidnight", () => {
  it("follows clock changes", () => {
    expect(easternMidnight(new Date("2026-11-06T18:00:00Z")).toISOString()).toBe("2026-11-06T05:00:00.000Z");
    expect(easternMidnight(new Date("2026-07-15T18:00:00Z")).toISOString()).toBe("2026-07-15T04:00:00.000Z");
  });
});
