import { describe, expect, it } from "vitest";
import { celebrationDetail, celebrationKind, countUpValue } from "@/lib/civic/celebration";

describe("celebrationKind", () => {
  it("reads the kind from what celebrate says", () => {
    expect(celebrationKind("New rank: Neighbor!")).toBe("rank");
    expect(celebrationKind("Level 3!")).toBe("level");
    expect(celebrationKind("Daily goal met!")).toBe("goal");
    expect(celebrationKind("Badge earned: First vote")).toBe("badge");
    expect(celebrationKind("Thanks for speaking up!")).toBe("thanks");
  });

  it("always has a line explaining it", () => {
    for (const kind of ["rank", "level", "goal", "badge", "thanks"] as const) expect(celebrationDetail(kind).length).toBeGreaterThan(10);
  });
});

describe("countUpValue", () => {
  it("starts at the old number, eases toward the new one, and lands on it exactly", () => {
    expect(countUpValue(100, 110, 0, 600)).toBe(100);
    const middle = countUpValue(100, 110, 300, 600);
    expect(middle).toBeGreaterThan(105);
    expect(middle).toBeLessThan(110);
    expect(countUpValue(100, 110, 600, 600)).toBe(110);
    expect(countUpValue(100, 110, 9999, 600)).toBe(110);
    expect(countUpValue(100, 110, 10, 0)).toBe(110);
  });
});
