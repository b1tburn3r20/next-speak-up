import { describe, expect, it } from "vitest";
import {
  easternToday,
  floorOutcome,
  groupFloorWeeks,
  mondayOf,
  weekLabel,
  weekPosition,
} from "@/lib/civic/floor-logic";

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
// A Thursday afternoon in Washington
const NOW = new Date("2026-11-05T20:00:00Z");

describe("mondayOf", () => {
  it("finds the Monday of any day in that week", () => {
    expect(mondayOf(date("2026-11-05"))).toEqual(date("2026-11-02"));
    expect(mondayOf(date("2026-11-02"))).toEqual(date("2026-11-02"));
    expect(mondayOf(date("2026-11-08"))).toEqual(date("2026-11-02"));
  });
});

describe("easternToday", () => {
  it("uses Washington's date, not UTC's, late in the evening", () => {
    expect(easternToday(new Date("2026-11-03T03:00:00Z"))).toEqual(date("2026-11-02"));
  });

  it("treats Sunday night in Washington as the old week, though it's Monday in UTC", () => {
    const sundayNight = new Date("2026-11-09T02:00:00Z");
    expect(weekPosition(date("2026-11-02"), sundayNight)).toBe("THIS");
    expect(weekPosition(date("2026-11-09"), sundayNight)).toBe("NEXT");
  });
});

describe("weekPosition and weekLabel", () => {
  it.each([
    ["2026-10-19", "EARLIER", "The week of Oct 19"],
    ["2026-10-26", "LAST", "Last week (week of Oct 26)"],
    ["2026-11-02", "THIS", "This week (week of Nov 2)"],
    ["2026-11-09", "NEXT", "Next week (week of Nov 9)"],
    ["2026-11-16", "LATER", "The week of Nov 16"],
  ])("%s is %s", (weekOf, position, label) => {
    expect(weekPosition(date(weekOf), NOW)).toBe(position);
    expect(weekLabel(date(weekOf), NOW)).toBe(label);
  });

  it("crosses a daylight saving change without an off-by-one", () => {
    // Clocks change on Nov 1, 2026.
    expect(weekPosition(date("2026-11-02"), new Date("2026-10-30T16:00:00Z"))).toBe("NEXT");
  });
});

describe("floorOutcome", () => {
  const weekOf = date("2026-11-09");

  it("says nothing before the House acts", () => {
    expect(floorOutcome([], weekOf)).toBeNull();
  });

  it("reports passage and failure", () => {
    expect(
      floorOutcome([{ actionCode: "8000", actionDate: date("2026-11-10") }], weekOf),
    ).toEqual({ kind: "PASSED", date: date("2026-11-10") });
    expect(floorOutcome([{ actionCode: "9000", actionDate: date("2026-11-10") }], weekOf)?.kind).toBe(
      "FAILED",
    );
  });

  it("ignores votes from before the bill was scheduled this time", () => {
    expect(floorOutcome([{ actionCode: "8000", actionDate: date("2025-03-01") }], weekOf)).toBeNull();
  });

  it("uses the latest result when a bill failed and then passed", () => {
    const actions = [
      { actionCode: "9000", actionDate: date("2026-11-10") },
      { actionCode: "8000", actionDate: date("2026-11-12") },
    ];
    expect(floorOutcome(actions, weekOf)?.kind).toBe("PASSED");
  });
});

describe("groupFloorWeeks", () => {
  it("puts what's coming up first, and past weeks after it", () => {
    const groups = groupFloorWeeks(
      [
        { weekOf: date("2026-10-26"), id: 1 },
        { weekOf: date("2026-11-02"), id: 2 },
        { weekOf: date("2026-11-09"), id: 3 },
        { weekOf: date("2026-11-09"), id: 4 },
      ],
      NOW,
    );
    expect(groups.map((group) => group.position)).toEqual(["THIS", "NEXT", "LAST"]);
    expect(groups[1].items.map((item) => item.id)).toEqual([3, 4]);
  });

  it("handles an empty schedule", () => {
    expect(groupFloorWeeks([], NOW)).toEqual([]);
  });
});
