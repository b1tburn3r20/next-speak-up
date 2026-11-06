import { describe, expect, it, vi } from "vitest";
import { can, canAccess, DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/auth/permissions";
import { billMoment, floorMoment } from "@/lib/civic/bill-moment";
import { AGE_OPTIONS, suggestTopics } from "@/lib/civic/onboarding-logic";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { lawSuccess } from "@/lib/civic/verdict";
import { activeNavHref } from "@/lib/nav";
import { fullDate, relativeTime } from "@/lib/relative-time";
import { isPrefetch, nextTrickle } from "@/lib/request-progress";
import { billPath, jurisdictionBase, memberPath, rollCallPath, routes, topicPath } from "@/lib/routes";
import { commandScore, normalize, rankResults, SCORE, scoreFields } from "@/lib/search/score";

vi.mock("@/prisma/client", () => ({ default: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

// Noon in Washington, on a Friday.
const NOW = new Date("2026-11-06T17:00:00.000Z");
const day = (text: string) => new Date(`${text}T00:00:00.000Z`);

describe("relativeTime", () => {
  it.each([
    ["2026-11-06", "today"],
    ["2026-11-05", "yesterday"],
    ["2026-11-07", "tomorrow"],
    ["2026-11-01", "5 days ago"],
    ["2026-10-30", "1 week ago"],
    ["2026-10-20", "2 weeks ago"],
    ["2026-09-06", "2 months ago"],
    ["2026-09-05", "2 months ago"],
    ["2025-11-06", "1 year ago"],
    ["2024-08-01", "2 years ago"],
  ])("says %s is %s", (date, expected) => {
    expect(relativeTime(day(date), NOW)).toBe(expected);
  });

  it.each([
    ["2026-11-09", "in 3 days"],
    ["2026-11-13", "in 1 week"],
    ["2026-11-16", "in 1 week, 3 days"],
    ["2026-11-20", "in 2 weeks"],
    ["2027-01-06", "in 2 months"],
    ["2027-01-20", "in 2 months, 2 weeks"],
    ["2028-02-06", "in 1 year, 3 months"],
  ])("says %s is %s", (date, expected) => {
    expect(relativeTime(day(date), NOW)).toBe(expected);
  });

  it("doesn't round a month up before it has passed", () => {
    expect(relativeTime(day("2026-10-07"), NOW)).toBe("4 weeks ago");
    expect(relativeTime(day("2026-10-06"), NOW)).toBe("1 month ago");
  });

  it("uses Washington's calendar, so late evening isn't already tomorrow", () => {
    const lateFriday = new Date("2026-11-07T03:00:00.000Z");
    expect(relativeTime(day("2026-11-06"), lateFriday)).toBe("today");
  });

  it("puts an exact moment on the day it was in Washington", () => {
    // 9pm Eastern on Nov 5 is already Nov 6 in UTC.
    const vote = new Date("2026-11-06T02:00:00.000Z");
    expect(relativeTime(vote, NOW)).toBe("yesterday");
    expect(fullDate(vote)).toBe("Thursday, November 5, 2026");
  });

  it("writes a full date for calendar dates without shifting the day", () => {
    expect(fullDate(day("2026-11-12"))).toBe("Thursday, November 12, 2026");
  });
});

describe("billMoment", () => {
  const bill = {
    billType: "hr",
    currentStatus: "BECAME_LAW",
    statusDate: day("2026-09-01"),
    introducedDate: day("2026-01-01"),
    latestActionDate: day("2026-09-02"),
  };

  it("uses the date the status changed, not the latest action", () => {
    expect(billMoment(bill)).toEqual({ label: "Became law", date: day("2026-09-01") });
  });

  it("says which chamber a bill passed, from where it started", () => {
    expect(billMoment({ ...bill, currentStatus: "PASSED_ORIGIN_CHAMBER" })?.label).toBe("Passed the House");
    expect(billMoment({ ...bill, billType: "s", currentStatus: "PASSED_ORIGIN_CHAMBER" })?.label).toBe(
      "Passed the Senate",
    );
  });

  it("shows when a new bill was introduced", () => {
    expect(billMoment({ ...bill, currentStatus: "INTRODUCED", statusDate: null })).toEqual({
      label: "Introduced",
      date: day("2026-01-01"),
    });
  });

  it("falls back, and never makes up a date", () => {
    expect(billMoment({ ...bill, currentStatus: "IN_COMMITTEE", statusDate: null })?.label).toBe("Introduced");
    expect(
      billMoment({
        ...bill,
        currentStatus: "INTRODUCED",
        statusDate: null,
        introducedDate: null,
        latestActionDate: null,
      }),
    ).toBeNull();
  });
});

describe("floorMoment", () => {
  it("counts down to a coming week's Monday, and only says possible", () => {
    const moment = floorMoment(day("2026-11-09"), NOW);
    expect(moment.text).toBe("House vote possible");
    expect(moment.fixedText).toBeUndefined();
    expect(moment.exactDate).toBe("Week of Monday, November 9, 2026");
    expect(moment.detail).toContain("may not get a vote");
  });

  it("doesn't count down during the week, because the day isn't known", () => {
    expect(floorMoment(day("2026-11-02"), NOW).fixedText).toBe("House vote possible this week");
  });

  it("speaks in the past for a week that's over", () => {
    expect(floorMoment(day("2026-10-26"), NOW).text).toBe("Listed for a House vote");
  });
});

describe("activeNavHref", () => {
  const hrefs = [
    "/dashboard",
    routes.federal.upcoming,
    routes.federal.bills,
    routes.federal.topics,
    routes.federal.legislators,
  ];

  it("only ever picks one link", () => {
    expect(activeNavHref(routes.federal.upcoming, hrefs)).toBe(routes.federal.upcoming);
    expect(activeNavHref(routes.federal.bills, hrefs)).toBe(routes.federal.bills);
  });

  it("has the longest match win, even for a link nested under another", () => {
    const nested = [...hrefs, "/federal/bills/special"];
    expect(activeNavHref("/federal/bills/special/thing", nested)).toBe("/federal/bills/special");
  });

  it("keeps the parent active on a detail page", () => {
    expect(activeNavHref(billPath("us-119-hr-1"), hrefs)).toBe(routes.federal.bills);
    expect(activeNavHref(topicPath("health"), hrefs)).toBe(routes.federal.topics);
  });

  it("doesn't match part of a word, or anything off the list", () => {
    expect(activeNavHref("/dashboard-old", hrefs)).toBeNull();
    expect(activeNavHref("/settings", hrefs)).toBeNull();
  });
});

describe("routes", () => {
  it("puts federal pages under /federal", () => {
    expect(billPath("us-119-hr-1")).toBe("/federal/bills/us-119-hr-1");
    expect(rollCallPath("us-119-hr-1", 5)).toBe("/federal/bills/us-119-hr-1/votes/5");
    expect(memberPath("B001261")).toBe("/federal/legislators/B001261");
  });

  it("leaves room for states", () => {
    expect(jurisdictionBase({ state: "TX" })).toBe("/state/tx");
    expect(billPath("tx-89-hb-1")).toBe("/state/tx/bills/tx-89-hb-1");
  });
});

describe("commandScore", () => {
  it("ranks exact, then starts-with, then a word start, then contains", () => {
    const exact = commandScore("bar", "Bar");
    const start = commandScore("bar", "Barrasso");
    const word = commandScore("bar", "John Barrasso");
    const middle = commandScore("bar", "Crowbar");
    expect(exact).toBe(SCORE.EXACT);
    expect(start).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(0);
  });

  it("finds someone through a typo", () => {
    expect(commandScore("barraso", "John Barrasso")).toBeGreaterThan(0);
    expect(commandScore("barrasso", "John Barasso")).toBeGreaterThan(0);
    expect(commandScore("brarasso", "John Barrasso")).toBeGreaterThan(0);
  });

  it("matches initials", () => {
    expect(commandScore("aoc", "Alexandria Ocasio Cortez")).toBe(SCORE.INITIALS);
  });

  it("needs every word to match", () => {
    expect(commandScore("clean water", "Clean Air Act")).toBe(0);
    expect(commandScore("water clean", "The Clean Water Act")).toBeGreaterThan(0);
  });

  it("prefers a phrase in order over the same words apart", () => {
    expect(commandScore("clean water", "The Clean Water Act")).toBeGreaterThan(
      commandScore("clean water", "Water for a Clean Future"),
    );
  });

  it("ignores case, accents, and citation punctuation", () => {
    expect(normalize("H.R. 12")).toBe("hr 12");
    expect(commandScore("hr 12", "H.R. 12")).toBe(SCORE.EXACT);
    expect(commandScore("lujan", "Ben Ray Luján")).toBeGreaterThan(0);
  });

  it("doesn't match random letters, or nothing at all", () => {
    expect(commandScore("zzz", "John Barrasso")).toBe(0);
    expect(commandScore("", "John Barrasso")).toBe(0);
    expect(commandScore("jb", "A very long sentence with nothing in common")).toBe(0);
  });

  it("doesn't count scattered letters across a long title", () => {
    expect(commandScore("tax", "To amend the Internal Revenue Act of a thing")).toBe(0);
  });
});

describe("scoreFields", () => {
  const fields = [{ text: "Ted Cruz" }, { text: "Texas TX", weight: 0.75 }, { text: "Republican", weight: 0.5 }];

  it("lets each word match a different field", () => {
    expect(scoreFields("ted texas", fields)).toBeGreaterThan(0);
  });

  it("ranks a name above a state or party", () => {
    expect(scoreFields("ted", fields)).toBeGreaterThan(scoreFields("texas", fields));
    expect(scoreFields("texas", fields)).toBeGreaterThan(scoreFields("republican", fields));
  });

  it("needs every word to match somewhere", () => {
    expect(scoreFields("ted ohio", fields)).toBe(0);
  });

  it("copes with empty fields", () => {
    expect(scoreFields("ted", [{ text: null }, { text: undefined }])).toBe(0);
  });
});

describe("rankResults", () => {
  it("sorts, drops non-matches, and limits", () => {
    const rows = [
      { id: "a", score: 0.2 },
      { id: "b", score: 0 },
      { id: "c", score: 0.9 },
      { id: "d", score: 0.5 },
    ];
    expect(rankResults(rows, 2).map((row) => row.id)).toEqual(["c", "d"]);
  });

  it("keeps ties in their original order", () => {
    const rows = [
      { id: "a", score: 0.5 },
      { id: "b", score: 0.5 },
    ];
    expect(rankResults(rows, 5).map((row) => row.id)).toEqual(["a", "b"]);
  });
});

describe("suggestTopics", () => {
  it("gives six real policy areas for every age", () => {
    for (const { value } of AGE_OPTIONS) {
      const topics = suggestTopics(value, "OH");
      expect(topics).toHaveLength(6);
      expect(new Set(topics).size).toBe(6);
      for (const topic of topics) expect(policyAreaByName(topic), topic).not.toBeNull();
    }
  });

  it("changes with age", () => {
    expect(suggestTopics("FROM_18_TO_24")).toContain("Education");
    expect(suggestTopics("FROM_65_TO_74")).toContain("Social Welfare");
  });

  it("puts what's tied to the state first", () => {
    expect(suggestTopics("FROM_25_TO_34", "IA")[0]).toBe("Agriculture and Food");
    expect(suggestTopics("FROM_25_TO_34", "ia")[0]).toBe("Agriculture and Food");
  });

  it("copes with no answers", () => {
    expect(suggestTopics(null, null)).toHaveLength(6);
    expect(suggestTopics("NOT_A_REAL_VALUE")).toHaveLength(6);
  });
});

describe("lawSuccess", () => {
  it("says what the number means", () => {
    expect(lawSuccess({ becameLawCount: 3, lawEligibleCount: 25 })).toEqual({
      percent: 12,
      sentence: "3 of 25 bills they sponsored became law",
    });
  });

  it("doesn't call a few laws zero percent", () => {
    expect(lawSuccess({ becameLawCount: 1, lawEligibleCount: 500 })?.percent).toBe(1);
  });

  it("shows nothing rather than 0% for someone with no bills", () => {
    expect(lawSuccess({ becameLawCount: 0, lawEligibleCount: 0 })).toBeNull();
    expect(lawSuccess({ becameLawCount: 0, lawEligibleCount: 12 })?.percent).toBe(0);
  });
});

describe("permissions", () => {
  const session = { user: { permissions: [{ name: "users.search" }] } };

  it("checks a permission, not a role's name", () => {
    expect(can(session, "users.search")).toBe(true);
    expect(can(session, "roles.manage")).toBe(false);
  });

  it("says no when signed out", () => {
    expect(can(null, "users.search")).toBe(false);
    expect(can({}, "users.search")).toBe(false);
  });

  it("handles access rules for links", () => {
    expect(canAccess(null, {})).toBe(true);
    expect(canAccess(null, { signedIn: true })).toBe(false);
    expect(canAccess(session, { signedIn: true })).toBe(true);
    expect(canAccess(session, { permission: "users.manage" })).toBe(false);
  });

  it("only uses permissions from the catalog in the defaults", () => {
    for (const permissions of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permission of permissions) expect(PERMISSIONS).toHaveProperty([permission]);
    }
    expect(DEFAULT_ROLE_PERMISSIONS.Member).toEqual([]);
  });
});

describe("search registry", () => {
  it("hides restricted providers from people without permission", async () => {
    const { providerFor, providersFor } = await import("@/lib/search/registry");
    const signedOut = providersFor(null).map((provider) => provider.id);
    expect(signedOut).toEqual(expect.arrayContaining(["bills", "representatives", "senators", "topics"]));
    expect(signedOut).not.toContain("users");
    expect(providerFor("users", null)).toBeNull();
    expect(providerFor("nonsense", null)).toBeNull();

    const admin = { user: { permissions: [{ name: "users.search" }] } } as never;
    expect(providerFor("users", admin)?.id).toBe("users");
    expect(providersFor(admin).map((provider) => provider.id)).toContain("users");
  });

  it("offers suggestions before anything's typed, without showing admin pages to everyone", async () => {
    const { pagesProvider } = await import("@/lib/search/providers/static");
    const results = await pagesProvider.search({ query: "", session: null, limit: 5 });
    expect(results.length).toBeGreaterThan(0);
    const all = await pagesProvider.search({ query: "permissions", session: null, limit: 5 });
    expect(all).toEqual([]);
  });

  it("scores glossary and topics without the database", async () => {
    const { glossaryProvider, topicsProvider } = await import("@/lib/search/providers/static");
    const words = await glossaryProvider.search({ query: "cloture", session: null, limit: 5 });
    expect(words[0]?.title.toLowerCase()).toContain("cloture");
    const topics = await topicsProvider.search({ query: "helth", session: null, limit: 5 });
    expect(topics[0]?.title).toBe("Health");
  });
});

describe("progress bar", () => {
  it("creeps forward without ever finishing on its own", () => {
    let percent = 12;
    for (let step = 0; step < 500; step += 1) {
      const next = nextTrickle(percent);
      expect(next).toBeGreaterThanOrEqual(percent);
      percent = next;
    }
    expect(percent).toBeLessThanOrEqual(92);
    expect(percent).toBeGreaterThan(85);
  });

  it("ignores pages fetched ahead of time", () => {
    expect(isPrefetch({ headers: { "Next-Router-Prefetch": "1" } })).toBe(true);
    expect(isPrefetch({ headers: { "Content-Type": "text/plain" } })).toBe(false);
    expect(isPrefetch()).toBe(false);
  });
});
