import { describe, expect, it } from "vitest";
import { agendaPostsAt, cityPositionLabel, groupTopics, seatName, speakWindow, summarizeOfficialRecord, validWard } from "@/lib/civic/city-logic";
import { cityByKey, stateByKey, type CityConfig, type StateConfig } from "@/lib/civic/states";

const IOWA = stateByKey("ia") as StateConfig;
const DES_MOINES = cityByKey(IOWA, "des-moines") as CityConfig;
const TZ = IOWA.timeZone;
// Monday, November 23, 2026 at 5 p.m. in Des Moines, which is 11 p.m. UTC in winter.
const MEETING = new Date("2026-11-23T23:00:00.000Z");

describe("when people can ask to speak", () => {
  it("opens ten days before, at midnight in the city", () => {
    const { opensAt } = speakWindow(MEETING, DES_MOINES, TZ);
    expect(opensAt.toISOString()).toBe("2026-11-13T06:00:00.000Z");
  });

  it("closes at 5 p.m. in the city the day before", () => {
    const { closesAt } = speakWindow(MEETING, DES_MOINES, TZ);
    expect(closesAt.toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });

  it("says whether it's open yet", () => {
    expect(speakWindow(MEETING, DES_MOINES, TZ, new Date("2026-11-08T12:00:00Z")).status).toBe("NOT_YET");
    expect(speakWindow(MEETING, DES_MOINES, TZ, new Date("2026-11-20T12:00:00Z")).status).toBe("OPEN");
    expect(speakWindow(MEETING, DES_MOINES, TZ, new Date("2026-11-22T23:30:00Z")).status).toBe("CLOSED");
  });

  it("follows daylight saving: a summer meeting closes at 5 p.m. local, not 6", () => {
    const august = new Date("2026-08-03T22:00:00.000Z");
    expect(speakWindow(august, DES_MOINES, TZ).closesAt.toISOString()).toBe("2026-08-02T22:00:00.000Z");
  });
});

describe("when the agenda goes up", () => {
  it("is 4 p.m. the Thursday before a Monday meeting", () => {
    expect(agendaPostsAt(MEETING, DES_MOINES, TZ).toISOString()).toBe("2026-11-19T22:00:00.000Z");
  });
});

describe("topics", () => {
  it("group by section, in the agenda's order", () => {
    const groups = groupTopics([
      { section: "Public hearings", title: "A" },
      { section: "Decisions", title: "B" },
      { section: "Public hearings", title: "C" },
      { section: null, title: "D" },
    ]);
    expect(groups.map((group) => [group.section, group.items.map((item) => item.title)])).toEqual([
      ["Public hearings", ["A", "C"]],
      ["Decisions", ["B"]],
      ["On the agenda", ["D"]],
    ]);
  });
});

describe("seats and wards", () => {
  it("names each seat", () => {
    expect(seatName("MAYOR", null)).toBe("Mayor");
    expect(seatName("COUNCIL_MEMBER", "AL")).toBe("At-large");
    expect(seatName("COUNCIL_MEMBER", "3")).toBe("Ward 3");
  });

  it("only accepts the city's own wards", () => {
    expect(validWard(DES_MOINES, "4")).toBe("4");
    expect(validWard(DES_MOINES, "5")).toBeNull();
    expect(validWard(DES_MOINES, "0")).toBeNull();
  });
});

describe("an official's record", () => {
  const vote = (position: string, day: string, description: string | null = null, totalNay = 0) => ({
    position,
    rollCall: { description, occurredAt: new Date(`${day}T23:00:00Z`), totalNay },
  });

  it("counts attendance, no votes, motions, and stepping aside, from the checked votes", () => {
    const record = summarizeOfficialRecord(
      [
        vote("YEA", "2026-07-13", "Moved by Gatto, seconded by Voss"),
        vote("NAY", "2026-07-13", "Moved by Simonson, seconded by Gatto", 1),
        vote("PRESENT", "2026-06-29"),
        vote("NOT_VOTING", "2026-06-08"),
      ],
      "Gatto",
    );
    expect(record).toMatchObject({ votes: 4, present: 3, nays: 1, abstained: 1, moved: 1, seconded: 1, meetings: 3, meetingsAttended: 2 });
    expect(record.attendancePercent).toBe(75);
  });

  it("never rounds a missed vote up to a perfect record", () => {
    const votes = [...Array.from({ length: 300 }, () => vote("YEA", "2026-07-13")), vote("NOT_VOTING", "2026-07-13")];
    expect(summarizeOfficialRecord(votes, "Voss").attendancePercent).toBe(99);
  });

  it("doesn't credit a motion to someone whose name is only part of another's", () => {
    expect(summarizeOfficialRecord([vote("YEA", "2026-07-13", "Moved by Vossberg")], "Voss").moved).toBe(0);
  });

  it("says each position plainly", () => {
    expect(cityPositionLabel("PRESENT")).toBe("Stepped aside");
    expect(cityPositionLabel("NOT_VOTING")).toBe("Absent");
  });
});
