import { describe, expect, it } from "vitest";
import {
  splitFloorItems,
  buildChamberBoard,
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

describe("buildChamberBoard", () => {
  const row = (weekOf: string, category: string, legislationRef: string) => ({
    weekOf: date(weekOf),
    category,
    legislationRef,
  });

  it("sorts rows into this week, next week, and later", () => {
    const board = buildChamberBoard(
      [row("2026-11-02", "RULE", "H.R. 1"), row("2026-11-09", "SUSPENSION", "H.R. 2"), row("2026-11-30", "RULE", "H.R. 3")],
      NOW,
    );
    expect(board.thisWeek.map((item) => item.legislationRef)).toEqual(["H.R. 1"]);
    expect(board.nextWeek.map((item) => item.legislationRef)).toEqual(["H.R. 2"]);
    expect(board.later.map((item) => item.legislationRef)).toEqual(["H.R. 3"]);
  });

  it("leaves last week out of the weeks", () => {
    const board = buildChamberBoard([row("2026-10-26", "RULE", "H.R. 1")], NOW);
    expect([...board.thisWeek, ...board.nextWeek, ...board.later]).toEqual([]);
  });

  it("shows undated items once, from the newest calendar", () => {
    const board = buildChamberBoard(
      [row("2026-11-02", "PENDING", "S. 1"), row("2026-11-02", "PENDING", "S. 2"), row("2026-11-09", "PENDING", "S. 1")],
      NOW,
    );
    expect(board.waiting.map((item) => item.legislationRef)).toEqual(["S. 1"]);
  });

  it("drops an undated item once it has a date", () => {
    const board = buildChamberBoard(
      [row("2026-11-09", "PENDING", "S. 1"), row("2026-11-09", "SCHEDULED", "S. 1")],
      NOW,
    );
    expect(board.waiting).toEqual([]);
    expect(board.nextWeek.map((item) => item.category)).toEqual(["SCHEDULED"]);
  });

  it("uses the newest meeting notice, and never one from a past week", () => {
    const later = row("2026-11-09", "NEXT_MEETING", "noon Monday");
    expect(buildChamberBoard([row("2026-11-02", "NEXT_MEETING", "noon Friday"), later], NOW).nextMeeting).toBe(later);
    expect(buildChamberBoard([row("2026-10-26", "NEXT_MEETING", "noon Friday")], NOW).nextMeeting).toBeNull();
  });

  it("doesn't count a meeting notice as a bill", () => {
    const board = buildChamberBoard([row("2026-11-09", "NEXT_MEETING", "noon Monday")], NOW);
    expect(board.nextWeek).toEqual([]);
  });
});

describe("splitFloorItems", () => {
  const week = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const passed = (iso: string) => [{ actionCode: "8000", actionDate: new Date(`${iso}T18:00:00Z`) }];
  const item = (id: number, weekOf: string, actions: { actionCode: string | null; actionDate: Date }[] = []) => ({ id, weekOf: week(weekOf), bill: { id, actions } });

  it("puts each bill in one group: voted by you, waiting on you, or already voted on by Congress", () => {
    const positions: Record<number, string> = { 1: "YEA", 4: "NAY" };
    const split = splitFloorItems(
      [item(1, "2026-11-09"), item(2, "2026-11-09"), item(3, "2026-11-09", passed("2026-11-10")), item(4, "2026-11-09", passed("2026-11-10"))],
      (id) => positions[id],
    );
    expect(split.voted.map((entry) => entry.id)).toEqual([1, 4]);
    expect(split.waiting.map((entry) => entry.id)).toEqual([2]);
    expect(split.missed.map((entry) => entry.id)).toEqual([3]);
  });

  it("counts a bill listed in two weeks once, at its newest week, and skips rows without a bill", () => {
    const split = splitFloorItems(
      [item(7, "2026-11-02", passed("2026-11-03")), { id: 99, weekOf: week("2026-11-09"), bill: null }, { ...item(7, "2026-11-09"), id: 8 }],
      () => null,
    );
    // The House passed it in an earlier week, but it's listed again, and the newest listing decides.
    expect(split.waiting.map((entry) => entry.id)).toEqual([8]);
    expect(split.missed).toEqual([]);
  });

  it("treats a skip as not voted", () => {
    expect(splitFloorItems([item(5, "2026-11-09")], () => "SKIP").waiting).toHaveLength(1);
  });
});
