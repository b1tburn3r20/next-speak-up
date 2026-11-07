import { describe, expect, it } from "vitest";
import { billOutlook } from "@/lib/civic/bill-outlook";
import { billStatusText, diedWithSession, explainIowaAction, governmentOfSlug, sessionHasEnded } from "@/lib/civic/government";
import { parseGeographies } from "@/lib/civic/location";
import { isFinalVote } from "@/lib/civic/alignment";
import { billPath, memberPath } from "@/lib/routes";
import { memberKeyOf } from "@/lib/civic/people";

const PAST = new Date("2026-05-03T00:00:00Z");
const FUTURE = new Date("2099-01-03T00:00:00Z");

describe("governmentOfSlug", () => {
  it("knows a bill's government from its slug", () => {
    expect(governmentOfSlug("us-119-hr-1").legislature).toBe("Congress");
    expect(governmentOfSlug("ia-91-hf-100").executive).toBe("Governor");
    expect(governmentOfSlug("ia-91-hf-100").stages).toContain("Governor");
  });
});

describe("a session that's over", () => {
  it("has ended only once its date has passed", () => {
    expect(sessionHasEnded(PAST)).toBe(true);
    expect(sessionHasEnded(FUTURE)).toBe(false);
    expect(sessionHasEnded(null)).toBe(false);
  });

  it("stops an unfinished bill, but doesn't change a finished one", () => {
    expect(diedWithSession("IN_COMMITTEE", PAST)).toBe(true);
    expect(diedWithSession("SIGNED", PAST)).toBe(false);
    expect(diedWithSession("IN_COMMITTEE", FUTURE)).toBe(false);
    expect(billStatusText("IN_COMMITTEE", "ia-91-hf-1", PAST)).toBe("Session ended");
    expect(billStatusText("SIGNED", "ia-91-hf-1", PAST)).toBe("Signed");
  });

  it("doesn't tell someone their voice can still count on it", () => {
    const outlook = billOutlook("IN_COMMITTEE", { slug: "ia-91-hf-1", endDate: PAST });
    expect(outlook.kind).toBe("DECIDED");
    expect(outlook.canInfluence).toBe(false);
    expect(billOutlook("IN_COMMITTEE", { slug: "ia-91-hf-1", endDate: FUTURE }).canInfluence).toBe(true);
  });
});

describe("words for the executive", () => {
  it("uses Governor for Iowa and President for Congress", () => {
    expect(billStatusText("TO_EXECUTIVE", "ia-91-hf-1")).toBe("Sent to the Governor");
    expect(billStatusText("TO_EXECUTIVE", "us-119-hr-1")).toBe("Sent to the President");
    expect(billOutlook("VETOED", { slug: "ia-91-hf-1" }).title).toBe("The Governor vetoed this");
    expect(billOutlook("VETOED").title).toBe("The President vetoed this");
    expect(billOutlook("INTRODUCED", { slug: "ia-91-hf-1" }).body).toContain("The Iowa Legislature");
    expect(billOutlook("INTRODUCED").body).toContain("Congress");
  });
});

describe("Iowa's actions in plain words", () => {
  it("explains the steps it's sure of", () => {
    expect(explainIowaAction("Passed House, yeas 85, nays 10. H.J. 841.")).toBe("The House passed it.");
    expect(explainIowaAction("Signed by Governor. S.J. 1054.")).toBe("It's now the law.");
    expect(explainIowaAction("Vetoed by Governor. H.J. 1236.")).toBe("The Governor vetoed it.");
  });

  it("doesn't mistake being enrolled for a committee step", () => {
    expect(explainIowaAction("Reported correctly enrolled, signed by Speaker and President, and sent to Governor. H.J. 1164.")).toBe(
      "The Legislature passed it, and sent it to the Governor.",
    );
  });

  it("leaves anything else as it's written", () => {
    expect(explainIowaAction("Explanation of vote. H.J. 945.")).toBeNull();
  });
});

describe("Iowa's URLs", () => {
  it("routes bills and legislators to the state's pages", () => {
    expect(billPath("ia-91-hf-100")).toBe("/state/ia/bills/ia-91-hf-100");
    expect(billPath("us-119-hr-1")).toBe("/federal/bills/us-119-hr-1");
    const key = memberKeyOf({ identifiers: [{ scheme: "iowa_legis", value: "123" }] });
    expect(key).toBe("ia:123");
    expect(memberPath(key as string)).toBe("/state/ia/legislators/123");
    expect(memberPath("T000193")).toBe("/federal/legislators/T000193");
  });
});

describe("Iowa's passage votes", () => {
  it("count as final, so they're compared with a person's vote", () => {
    expect(isFinalVote("Shall the bill pass?")).toBe(true);
  });
});

describe("the geocoder's state layers", () => {
  // The layer names and values here are what the Census returned for an address in Des Moines.
  const iowa = {
    "119th Congressional Districts": [{ STATE: "19", CD119: "03" }],
    "2024 State Legislative Districts - Upper": [{ BASENAME: "18", STATE: "19" }],
    "2024 State Legislative Districts - Lower": [{ BASENAME: "36", STATE: "19" }],
    "Incorporated Places": [{ GEOID: "1921000", BASENAME: "Des Moines" }],
  };

  it("reads both districts and the city", () => {
    expect(parseGeographies(iowa)?.stateSeats).toEqual({ upper: "18", lower: "36", placeGeoid: "1921000" });
  });

  it("gives no seats when the response has none", () => {
    expect(parseGeographies({ "119th Congressional Districts": iowa["119th Congressional Districts"] })?.stateSeats).toBeUndefined();
  });

  it("isn't thrown by a new map year", () => {
    const later = { ...iowa, "2026 State Legislative Districts - Lower": [{ BASENAME: "7" }] } as Record<string, unknown>;
    delete later["2024 State Legislative Districts - Lower"];
    expect(parseGeographies(later)?.stateSeats?.lower).toBe("7");
  });
});
