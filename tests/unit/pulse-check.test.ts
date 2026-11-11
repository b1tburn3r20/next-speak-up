import { describe, expect, it } from "vitest";
import { pulseHeadline, pulseSize, summarizePulse } from "@/lib/civic/pulse-check";

const vote = (slug: string, you: string, them: string | null) => ({ slug, label: slug, title: slug, you, them });

describe("pulseSize", () => {
  it("takes 3, 5, or 10, and falls back to 5", () => {
    expect(pulseSize("3")).toBe(3);
    expect(pulseSize("10")).toBe(10);
    expect(pulseSize("7")).toBe(5);
    expect(pulseSize(undefined)).toBe(5);
    expect(pulseSize(["10", "3"])).toBe(10);
  });
});

describe("summarizePulse", () => {
  it("counts agreements, and leaves out votes the member missed", () => {
    const summary = summarizePulse([vote("a", "YEA", "YEA"), vote("b", "NAY", "YEA"), vote("c", "YEA", "NOT_VOTING")]);
    expect(summary.compared).toBe(2);
    expect(summary.matched).toBe(1);
    expect(summary.percent).toBe(50);
    expect(summary.rows.map((row) => row.outcome)).toEqual(["MATCH", "DIFFERENT", "DID_NOT_VOTE"]);
  });

  it("has no percent when nothing could be compared", () => {
    expect(summarizePulse([]).percent).toBeNull();
  });
});

describe("pulseHeadline", () => {
  it("says it plainly", () => {
    expect(pulseHeadline("Joni", summarizePulse([vote("a", "YEA", "YEA"), vote("b", "NAY", "NAY")]))).toBe("You and Joni agreed on all 2.");
    expect(pulseHeadline("Joni", summarizePulse([vote("a", "YEA", "NAY")]))).toBe("You and Joni disagreed on all 1.");
    expect(pulseHeadline("Joni", summarizePulse([vote("a", "YEA", "NAY"), vote("b", "NAY", "NAY")]))).toBe("You and Joni agreed on 1 of 2.");
    expect(pulseHeadline("Joni", summarizePulse([]))).toContain("Vote on a bill");
  });
});
