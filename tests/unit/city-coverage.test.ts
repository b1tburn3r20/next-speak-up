import { describe, expect, it } from "vitest";
import { auditCity, coverageGate, nextScheduledMeeting, parseMeetingSchedule, type CityFacts } from "@/lib/civic/city-logic";

const TZ = "America/Chicago";
// Monday, November 9, 2026, at noon in Iowa.
const NOW = new Date("2026-11-09T18:00:00.000Z");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("a council's stated schedule", () => {
  it("reads the forms directories and city sites use", () => {
    expect(parseMeetingSchedule("1st/3rd Wed")).toEqual({ weeks: [1, 3], weekday: 3, time: null });
    expect(parseMeetingSchedule("2nd & 4th Mondays at 6:00 p.m.")).toEqual({ weeks: [2, 4], weekday: 1, time: { hour: 18, minute: 0 } });
    expect(parseMeetingSchedule("Every Tuesday, 7 PM")).toEqual({ weeks: [], weekday: 2, time: { hour: 19, minute: 0 } });
    expect(parseMeetingSchedule("Last Thursday")).toEqual({ weeks: [-1], weekday: 4, time: null });
  });

  it("gives nothing rather than guess", () => {
    expect(parseMeetingSchedule(null)).toBeNull();
    expect(parseMeetingSchedule("As needed")).toBeNull();
    // Two different days can't be one date.
    expect(parseMeetingSchedule("1st Mon and 3rd Tue")).toBeNull();
    // A day with no week isn't a schedule.
    expect(parseMeetingSchedule("Mondays")).toBeNull();
  });

  it("finds the next meeting by it", () => {
    // November 2026: the 1st Wednesday is the 4th, the 3rd is the 18th.
    expect(nextScheduledMeeting("1st/3rd Wed", TZ, NOW)).toEqual({ day: day("2026-11-18"), startsAt: null });
    // The 2nd Monday is today. With no time it still counts.
    expect(nextScheduledMeeting("2nd Mon", TZ, NOW)?.day).toEqual(day("2026-11-09"));
  });

  it("skips today's meeting once it has started", () => {
    // 11 a.m. today has passed, so the next 2nd Monday is in December.
    expect(nextScheduledMeeting("2nd Mon 11:00 AM", TZ, NOW)?.day).toEqual(day("2026-12-14"));
    // 6 p.m. today hasn't, and it's stored as Iowa's 6 p.m.
    expect(nextScheduledMeeting("2nd Mon 6:00 PM", TZ, NOW)?.startsAt).toEqual(new Date("2026-11-10T00:00:00.000Z"));
  });

  it("finds the last weekday of the month", () => {
    expect(nextScheduledMeeting("Last Thursday", TZ, NOW)?.day).toEqual(day("2026-11-26"));
  });
});

const FULL: CityFacts = {
  mayor: true,
  upperDistricts: 1,
  lowerDistricts: 1,
  phone: "(641) 628-4173",
  address: null,
  upcomingMeeting: false,
  meetingSchedule: "1st/3rd Wed",
  topics: false,
  speakUrl: null,
  speakInfo: null,
};

describe("each city's audit", () => {
  it("counts a stated schedule as a next meeting", () => {
    expect(auditCity(FULL)).toEqual({ mayor: true, legislators: true, cityHall: true, nextMeeting: true, topics: false, speak: false });
  });

  it("needs both chambers for legislators", () => {
    expect(auditCity({ ...FULL, upperDistricts: 0 }).legislators).toBe(false);
  });

  it("doesn't count a schedule it can't read", () => {
    expect(auditCity({ ...FULL, meetingSchedule: "As needed" }).nextMeeting).toBe(false);
  });
});

describe("the 95% gate", () => {
  const passing = auditCity(FULL);
  const noMayor = auditCity({ ...FULL, mayor: false });

  it("passes at 95% of cities with a mayor, legislators, and City Hall", () => {
    const gate = coverageGate([...Array(19).fill(passing), noMayor]);
    expect(gate.passed).toBe(true);
    expect(gate.items.find((item) => item.item === "mayor")).toMatchObject({ have: 19, share: 0.95, passed: true });
  });

  it("fails below it, and says which item", () => {
    const gate = coverageGate([...Array(18).fill(passing), noMayor, noMayor]);
    expect(gate.passed).toBe(false);
    expect(gate.items.filter((item) => !item.passed).map((item) => item.item)).toEqual(["mayor"]);
  });

  it("counts topics and speaking without failing on them", () => {
    const gate = coverageGate(Array(20).fill(passing));
    expect(gate.passed).toBe(true);
    expect(gate.items.find((item) => item.item === "topics")).toMatchObject({ have: 0, required: false, passed: true });
  });

  it("never passes with no cities", () => {
    expect(coverageGate([]).passed).toBe(false);
  });
});

describe("the main thing to do on a city's page", () => {
  it("is signing up to speak, then a reminder, then calling City Hall, then the agendas", async () => {
    const { primaryCityAction } = await import("@/lib/civic/city-logic");
    expect(primaryCityAction({ speakUrl: "https://x/speak", meetingKnown: true, phone: "515", agendaUrl: "https://x" }).kind).toBe("SPEAK");
    expect(primaryCityAction({ speakUrl: null, meetingKnown: true, phone: "515", agendaUrl: "https://x" }).kind).toBe("REMIND");
    expect(primaryCityAction({ speakUrl: null, meetingKnown: false, phone: "(515) 555-0100", agendaUrl: null })).toEqual({
      kind: "CALL",
      href: "tel:5155550100",
      phone: "(515) 555-0100",
    });
    expect(primaryCityAction({ speakUrl: null, meetingKnown: false, phone: null, agendaUrl: "https://x" }).kind).toBe("AGENDA");
    expect(primaryCityAction({ speakUrl: null, meetingKnown: false, phone: null, agendaUrl: null }).kind).toBe("NONE");
  });
});

describe("finding a place by typing", () => {
  it("puts names that start with it first, then words, then anywhere, keeping the original order", async () => {
    const { matchPlaces, foldName } = await import("@/lib/civic/place-search");
    const places = [{ name: "Des Moines" }, { name: "West Des Moines" }, { name: "Ames" }, { name: "Saint Ansgar" }, { name: "Le Mars" }];
    expect(matchPlaces(places, "des").map((place) => place.name)).toEqual(["Des Moines", "West Des Moines"]);
    expect(matchPlaces(places, "mes").map((place) => place.name)).toEqual(["Ames"]);
    expect(matchPlaces(places, "st. ans").map((place) => place.name)).toEqual(["Saint Ansgar"]);
    expect(matchPlaces(places, "  ")).toHaveLength(5);
    expect(foldName("Cañon City")).toBe("canon city");
  });
});
