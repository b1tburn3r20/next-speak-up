// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  alignmentByPolicyArea,
  computeAlignment,
  computeMemberStats,
  isFinalVote,
  majorityPosition,
  type Position,
} from "@/lib/civic/alignment";
import {
  billLabel,
  billSlug,
  billStageIndex,
  isStale,
  partyLabel,
  positionLabel,
  seatLabel,
} from "@/lib/civic/labels";
import {
  censusLayers,
  censusLookupUrl,
  parseCensusResult,
  censusVintage,
  congressOn,
  districtFromAddress,
  districtFromCoordinates,
  isValidCoordinate,
  normalizeDistrict,
  parseGeographies,
} from "@/lib/civic/location";

function vote(userPosition: Position, repPosition: Position, policyArea?: string) {
  return { userPosition, repPosition, policyArea };
}

describe("computeAlignment", () => {
  it("is null, not 0%, when there's nothing to compare", () => {
    expect(computeAlignment([])).toEqual({ compared: 0, matched: 0, percent: null });
  });

  it("counts agreements on clear yes and no votes", () => {
    const result = computeAlignment([
      vote("YEA", "YEA"),
      vote("NAY", "NAY"),
      vote("YEA", "NAY"),
      vote("NAY", "YEA"),
    ]);
    expect(result).toEqual({ compared: 4, matched: 2, percent: 50 });
  });

  it("doesn't count a vote the rep missed as a disagreement", () => {
    const result = computeAlignment([vote("YEA", "YEA"), vote("YEA", "NOT_VOTING")]);
    expect(result).toEqual({ compared: 1, matched: 1, percent: 100 });
  });

  it("ignores present votes on either side", () => {
    const result = computeAlignment([vote("PRESENT", "YEA"), vote("YEA", "PRESENT")]);
    expect(result.compared).toBe(0);
    expect(result.percent).toBeNull();
  });

  it("rounds to a whole percent", () => {
    const result = computeAlignment([vote("YEA", "YEA"), vote("YEA", "NAY"), vote("YEA", "NAY")]);
    expect(result.percent).toBe(33);
  });
});

describe("alignmentByPolicyArea", () => {
  it("groups by area and skips areas with nothing to compare", () => {
    const result = alignmentByPolicyArea([
      vote("YEA", "YEA", "Taxation"),
      vote("YEA", "NAY", "Taxation"),
      vote("YEA", "NOT_VOTING", "Health"),
      vote("YEA", "YEA"),
    ]);
    expect(Object.keys(result)).toEqual(["Taxation"]);
    expect(result.Taxation.percent).toBe(50);
  });
});

describe("computeMemberStats", () => {
  it("handles a member with no votes yet", () => {
    expect(computeMemberStats([])).toEqual({
      totalVotes: 0,
      attendancePercent: null,
      missedVotes: 0,
      partyLoyaltyPercent: null,
    });
  });

  it("counts present as attending, but not as a party vote", () => {
    const stats = computeMemberStats([
      { position: "YEA", partyMajority: "YEA" },
      { position: "NAY", partyMajority: "YEA" },
      { position: "PRESENT", partyMajority: "YEA" },
      { position: "NOT_VOTING", partyMajority: "YEA" },
    ]);
    expect(stats.attendancePercent).toBe(75);
    expect(stats.missedVotes).toBe(1);
    expect(stats.partyLoyaltyPercent).toBe(50);
  });

  it("never rounds missed votes up to a perfect record", () => {
    const records = Array.from({ length: 915 }, (_, index) => ({
      position: (index < 4 ? "NOT_VOTING" : "YEA") as Position,
      partyMajority: null,
    }));
    expect(computeMemberStats(records).attendancePercent).toBe(99);
    const perfect = records.map((record) => ({ ...record, position: "YEA" as Position }));
    expect(computeMemberStats(perfect).attendancePercent).toBe(100);
  });

  it("leaves tied party votes out of loyalty", () => {
    const stats = computeMemberStats([
      { position: "YEA", partyMajority: null },
      { position: "YEA", partyMajority: "YEA" },
    ]);
    expect(stats.partyLoyaltyPercent).toBe(100);
  });
});

describe("majorityPosition", () => {
  it("picks the larger side, and treats a tie as no majority", () => {
    expect(majorityPosition(5, 3)).toBe("YEA");
    expect(majorityPosition(3, 5)).toBe("NAY");
    expect(majorityPosition(4, 4)).toBeNull();
    expect(majorityPosition(0, 0)).toBeNull();
  });
});

describe("isFinalVote", () => {
  it.each([
    "On Passage",
    "On Agreeing to the Resolution",
    "On Motion to Suspend the Rules and Pass",
    "On Motion to Concur in the Senate Amendment",
    "On Overriding the Veto",
    "On Passage of the Bill",
    "On the Joint Resolution",
    "On the Concurrent Resolution",
    "On the Resolution",
    "On Agreeing to the Conference Report",
    "On Motion to Suspend the Rules and Pass, as Amended",
  ])("treats %s as final", (question) => {
    expect(isFinalVote(question)).toBe(true);
  });

  it.each([
    "On Motion to Table",
    "Call by States",
    "On Ordering the Previous Question",
    "On Agreeing to the Amendment",
    "On the Amendment",
    "On the Cloture Motion",
    "On Cloture on the Motion to Proceed",
    "On the Motion to Proceed",
    "On the Motion to Discharge",
    "On the Motion to Recommit",
    "On the Nomination",
    "On the Motion",
    "",
    null,
  ])(
    "treats %s as procedural",
    (question) => {
      expect(isFinalVote(question)).toBe(false);
    },
  );
});

describe("normalizeDistrict", () => {
  it.each([
    [null, "AL"],
    [undefined, "AL"],
    ["", "AL"],
    ["00", "AL"],
    ["98", "AL"],
    [0, "AL"],
    ["AL", "AL"],
    ["02", "2"],
    [14, "14"],
    ["nonsense", "AL"],
  ])("%s becomes %s", (input, expected) => {
    expect(normalizeDistrict(input)).toBe(expected);
  });
});

describe("parseGeographies", () => {
  it("reads a normal district", () => {
    const result = parseGeographies({
      "119th Congressional Districts": [{ STATE: "48", CD119: "02" }],
    });
    expect(result).toEqual({ regionCode: "TX", districtCode: "2" });
  });

  it("keeps working when the Congress number changes", () => {
    const result = parseGeographies({
      "120th Congressional Districts": [{ STATE: "06", CD120: "12" }],
    });
    expect(result).toEqual({ regionCode: "CA", districtCode: "12" });
  });

  it("maps at-large and delegate seats", () => {
    expect(
      parseGeographies({ "119th Congressional Districts": [{ STATE: "56", CD119: "00" }] }),
    ).toEqual({ regionCode: "WY", districtCode: "AL" });
    expect(
      parseGeographies({ "119th Congressional Districts": [{ STATE: "11", CD119: "98" }] }),
    ).toEqual({ regionCode: "DC", districtCode: "AL" });
  });

  it.each([
    [null],
    [{}],
    [{ "119th Congressional Districts": [] }],
    [{ "119th Congressional Districts": [{ STATE: "99", CD119: "1" }] }],
    [{ "119th Congressional Districts": [{ STATE: "48" }] }],
  ])("returns null for unusable data: %j", (input) => {
    expect(parseGeographies(input)).toBeNull();
  });
});

describe("congressOn", () => {
  it.each([
    ["2025-01-03", 119],
    ["2026-11-05", 119],
    ["2027-01-02", 119],
    ["2027-01-03", 120],
    ["2029-01-03", 121],
  ])("%s is the %ith", (date, congress) => {
    expect(congressOn(new Date(`${date}T12:00:00Z`))).toBe(congress);
  });
});

describe("censusVintage", () => {
  it("uses the sitting Congress's map after an election, not the next one's", () => {
    expect(censusVintage(new Date("2026-11-05T12:00:00Z"))).toBe("ACS2024_Current");
    expect(censusVintage(new Date("2027-01-02T12:00:00Z"))).toBe("ACS2024_Current");
  });

  it("moves to the current map once the new Congress is seated", () => {
    expect(censusVintage(new Date("2027-01-03T12:00:00Z"))).toBe("Current_Current");
  });
});

describe("isValidCoordinate", () => {
  it("accepts real coordinates, and rejects anything else", () => {
    expect(isValidCoordinate(30.2, -97.7)).toBe(true);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate("30", -97)).toBe(false);
    expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
  });
});

describe("geocoder calls", () => {
  const body = {
    result: {
      geographies: { "119th Congressional Districts": [{ STATE: "48", CD119: "02" }] },
      addressMatches: [
        { geographies: { "119th Congressional Districts": [{ STATE: "36", CD119: "14" }] } },
      ],
    },
  };
  const ok = () => vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));

  it("sends longitude as x and latitude as y", async () => {
    const fetcher = ok();
    await expect(districtFromCoordinates(30, -95, fetcher)).resolves.toEqual({
      regionCode: "TX",
      districtCode: "2",
    });
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("x")).toBe("-95");
    expect(url.searchParams.get("y")).toBe("30");
  });

  it("uses the first address match", async () => {
    await expect(districtFromAddress("1 Main St", ok())).resolves.toEqual({
      regionCode: "NY",
      districtCode: "14",
    });
  });

  it("returns null when an address has no match", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ result: { addressMatches: [] } })));
    await expect(districtFromAddress("nowhere", fetcher)).resolves.toBeNull();
  });

  it("asks only for the layers it reads, for the map in use", async () => {
    const fetcher = ok();
    await districtFromCoordinates(30, -95, fetcher);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("layers")).toBe(censusLayers(url.searchParams.get("vintage") as string));
    expect(censusLayers("ACS2024_Current")).toBe("28,54,56,58");
    expect(censusLayers("Current_Current")).toBe("all");
  });

  it("tries once more when the Census couldn't be reached, but not when it answered with an error", async () => {
    const flaky = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValue(new Response(JSON.stringify(body)));
    await expect(districtFromCoordinates(30, -95, flaky)).resolves.toEqual({ regionCode: "TX", districtCode: "2" });
    expect(flaky).toHaveBeenCalledTimes(2);
    const down = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    await expect(districtFromCoordinates(30, -95, down)).rejects.toThrow("503");
    expect(down).toHaveBeenCalledTimes(1);
  });

  it("builds the same lookup for the browser, as JSONP with a callback", () => {
    const point = new URL(censusLookupUrl({ lat: 41.5, lng: -93.6 }, "jsonp", "answer"));
    expect(point.pathname).toMatch(/\/coordinates$/);
    expect(point.searchParams.get("format")).toBe("jsonp");
    expect(point.searchParams.get("callback")).toBe("answer");
    expect(point.searchParams.get("x")).toBe("-93.6");
    const address = new URL(censusLookupUrl({ address: "400 Robert D. Ray Dr, Des Moines, IA" }));
    expect(address.pathname).toMatch(/\/onelineaddress$/);
    expect(address.searchParams.get("address")).toBe("400 Robert D. Ray Dr, Des Moines, IA");
    expect(address.searchParams.get("callback")).toBeNull();
  });

  it("reads a point's district, or an address's first match, and nothing from junk", () => {
    expect(parseCensusResult({ lat: 30, lng: -95 }, body)).toEqual({ regionCode: "TX", districtCode: "2" });
    expect(parseCensusResult({ address: "x" }, body)).toEqual({ regionCode: "NY", districtCode: "14" });
    expect(parseCensusResult({ lat: 30, lng: -95 }, "<script>")).toBeNull();
    expect(parseCensusResult({ address: "x" }, null)).toBeNull();
  });

  it("raises an error when the geocoder is down", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    await expect(districtFromCoordinates(30, -95, fetcher)).rejects.toThrow("503");
  });
});

describe("labels", () => {
  it("formats bills", () => {
    expect(billLabel("hr", 1)).toBe("H.R. 1");
    expect(billLabel("hjres", 7)).toBe("H.J.Res. 7");
    expect(billSlug(119, "HR", 1)).toBe("us-119-hr-1");
  });

  it("formats seats, including at-large seats and senators", () => {
    expect(seatLabel("Texas", "2", "LOWER")).toBe("Texas, District 2");
    expect(seatLabel("Wyoming", "AL", "LOWER")).toBe("Wyoming, At Large");
    expect(seatLabel("Wyoming", "STATE", "UPPER")).toBe("Wyoming");
  });

  it("never shows a raw code for a position or party", () => {
    expect(positionLabel("NOT_VOTING")).toBe("Didn't vote");
    expect(partyLabel("D")).toBe("Democrat");
    expect(partyLabel(null)).toBe("Unknown party");
  });

  it("orders stages so vetoed bills sit before law", () => {
    expect(billStageIndex("INTRODUCED")).toBe(0);
    expect(billStageIndex("VETOED")).toBeLessThan(billStageIndex("BECAME_LAW"));
    expect(billStageIndex("BECAME_LAW")).toBe(5);
  });

  it("flags stale or undated data", () => {
    const now = new Date("2026-11-05T00:00:00Z");
    expect(isStale(new Date("2026-11-01T00:00:00Z"), 7, now)).toBe(false);
    expect(isStale(new Date("2026-10-01T00:00:00Z"), 7, now)).toBe(true);
    expect(isStale(null, 7, now)).toBe(true);
  });
});
