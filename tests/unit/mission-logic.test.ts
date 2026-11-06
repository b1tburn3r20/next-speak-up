import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isFinalVote } from "@/lib/civic/alignment";
import { buildDigest, splitSentences } from "@/lib/civic/digest";
import { explainAction, GLOSSARY } from "@/lib/civic/glossary";
import { computeNextSteps, type NextStepState } from "@/lib/civic/next-steps";
import { POLICY_AREAS, POLICY_FAMILIES, policyAreaByName, policyAreaBySlug, policyStyle } from "@/lib/civic/policy-areas";
import { computeProgress, computeStreak } from "@/lib/civic/progress";
import {
  alignmentVerdict,
  biggestDifference,
  comparedToChamber,
  recapSentence,
  revealOutcome,
} from "@/lib/civic/verdict";

describe("final votes", () => {
  const cases = JSON.parse(readFileSync("tests/unit/final-vote-cases.json", "utf8"));
  it.each(cases)("matches the pipeline's rule: $question", ({ question, final }) => {
    expect(isFinalVote(question)).toBe(final);
  });
});

describe("alignmentVerdict", () => {
  it("won't give a verdict on too few votes, and says how many more", () => {
    expect(alignmentVerdict(0, 0)).toMatchObject({ tone: "unknown", percent: null, votesNeeded: 3 });
    const two = alignmentVerdict(2, 2);
    expect(two.percent).toBeNull();
    expect(two.detail).toContain("1 more bill they");
  });

  it.each([
    [10, 9, "good", "Represents you"],
    [10, 7, "good", "Represents you"],
    [10, 5, "mixed", "Sometimes represents you"],
    [10, 4, "mixed", "Sometimes represents you"],
    [10, 3, "bad", "Doesn't represent you"],
    [3, 0, "bad", "Doesn't represent you"],
  ])("%i compared, %i matched is %s", (compared, matched, tone, label) => {
    expect(alignmentVerdict(compared, matched)).toMatchObject({ tone, label });
  });

  it("always says what the number is based on", () => {
    expect(alignmentVerdict(10, 7).detail).toContain("7 of 10 bills");
  });
});

describe("revealOutcome", () => {
  it.each([
    ["YEA", "YEA", "MATCH"],
    ["NAY", "NAY", "MATCH"],
    ["YEA", "NAY", "DIFFERENT"],
    ["YEA", "NOT_VOTING", "DID_NOT_VOTE"],
    ["NAY", "PRESENT", "DID_NOT_VOTE"],
    ["YEA", null, "NO_RECORD"],
    [null, "YEA", "NO_RECORD"],
  ] as const)("you %s, rep %s is %s", (user, rep, outcome) => {
    expect(revealOutcome(user, rep)).toBe(outcome);
  });
});

describe("comparedToChamber", () => {
  it("names the right chamber", () => {
    expect(comparedToChamber(72, "LOWER")).toBe("More than 72% of the House");
    expect(comparedToChamber(10, "UPPER")).toBe("More than 10% of the Senate");
  });

  it("says nothing without data", () => {
    expect(comparedToChamber(null, "LOWER")).toBeNull();
  });
});

describe("biggestDifference", () => {
  it("finds the area you most disagree on, with enough votes to say so", () => {
    const areas = [
      { policyArea: "Health", compared: 5, percent: 80 },
      { policyArea: "Energy", compared: 1, percent: 0 },
      { policyArea: "Taxation", compared: 4, percent: 25 },
      { policyArea: "Law", compared: 2, percent: 50 },
    ];
    expect(biggestDifference(areas)?.policyArea).toBe("Taxation");
  });

  it("is empty when you agree on everything", () => {
    expect(biggestDifference([{ compared: 5, percent: 90 }])).toBeNull();
  });
});

describe("recapSentence", () => {
  const base = { days: 30, lastCongressVote: new Date("2026-09-16T00:00:00Z") };

  it("explains a quiet stretch, instead of showing zeros", () => {
    const sentence = recapSentence({ ...base, votes: 0, missed: 0 });
    expect(sentence).toContain("No recorded votes");
    expect(sentence).toContain("Sep 16");
  });

  it("describes attendance", () => {
    expect(recapSentence({ ...base, votes: 12, missed: 0 })).toBe(
      "Voted on all 12 recorded votes in the last 30 days.",
    );
    expect(recapSentence({ ...base, votes: 9, missed: 3 })).toContain("missed 3");
  });
});

describe("buildDigest", () => {
  it("has nothing to offer when there's no summary", () => {
    expect(buildDigest(null)).toBeNull();
    expect(buildDigest("")).toBeNull();
  });

  it("removes CRS boilerplate and the heading, using CRS's own words", () => {
    // The real opening of a CRS summary, which used to fill the top of the bill page.
    const digest = buildDigest(
      "<p><em>The following analysis is based on draft bill text that was made available by the House of Representatives and may differ from the bill text as introduced.</em></p>" +
        "<p><strong>Nuclear REFUEL Act</strong></p>" +
        "<p>This bill directs the Nuclear Regulatory Commission to establish licensing for recycling nuclear fuel at facilities across the country. The commission must report to Congress. It must also consult with the states.</p>",
    );
    expect(digest?.lead).toBe(
      "This bill directs the Nuclear Regulatory Commission to establish licensing for recycling nuclear fuel at facilities across the country.",
    );
    expect(digest?.points).toEqual(["The commission must report to Congress.", "It must also consult with the states."]);
    expect(digest?.hasMore).toBe(false);
  });

  it("joins a very short opener with what follows", () => {
    const digest = buildDigest("<p>This bill sets rules. Specifically, it limits fees that banks may charge.</p>");
    expect(digest?.lead).toBe("This bill sets rules. Specifically, it limits fees that banks may charge.");
  });

  it("says when there's more to read", () => {
    const body = Array.from({ length: 8 }, (_, i) => `Sentence number ${i} of this long summary says something quite specific.`).join(" ");
    expect(buildDigest(`<p>${body}</p>`)?.hasMore).toBe(true);
  });

  it("gives nothing when only boilerplate is left", () => {
    expect(buildDigest("<p>The following summary is based on draft text.</p>")).toBeNull();
  });
});

describe("splitSentences", () => {
  it("isn't fooled by abbreviations", () => {
    expect(splitSentences("This amends H.R. 1 and the U.S. Code. It also changes Sec. 4 of the law.")).toEqual([
      "This amends H.R. 1 and the U.S. Code.",
      "It also changes Sec. 4 of the law.",
    ]);
  });
});

describe("progress", () => {
  const now = new Date("2026-11-05T17:00:00Z");
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const base = { now, repsFound: false, bestMatchCompared: 0, floorVotes: 0, policyAreasVoted: 0 };

  it("counts days in a row", () => {
    expect(computeStreak([now, daysAgo(1), daysAgo(2)], now)).toBe(3);
  });

  it("keeps a streak alive until a full day is missed", () => {
    expect(computeStreak([daysAgo(1), daysAgo(2)], now)).toBe(2);
    expect(computeStreak([daysAgo(2), daysAgo(3)], now)).toBe(0);
  });

  it("counts several votes in a day once", () => {
    expect(computeStreak([now, now, daysAgo(1)], now)).toBe(2);
  });

  it("uses the user's day, not UTC's", () => {
    const lateEvening = new Date("2026-11-06T03:00:00Z");
    const sameEveningEarlier = new Date("2026-11-05T23:00:00Z");
    expect(computeStreak([lateEvening, sameEveningEarlier], lateEvening)).toBe(1);
  });

  it("is zero with no votes", () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it("works out XP and levels from votes", () => {
    const votes = Array.from({ length: 12 }, () => daysAgo(5));
    expect(computeProgress({ ...base, voteDates: votes })).toMatchObject({
      votesCast: 12,
      xp: 120,
      level: 2,
      levelPercent: 20,
      xpToNextLevel: 80,
    });
  });

  it("tracks the daily goal", () => {
    const progress = computeProgress({ ...base, voteDates: [now, now, now] });
    expect(progress).toMatchObject({ votedToday: 3, dailyGoalMet: true });
  });

  it("only gives badges that were earned", () => {
    const earned = (input: Partial<typeof base> & { voteDates: Date[] }) =>
      computeProgress({ ...base, ...input }).badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned({ voteDates: [] })).toEqual([]);
    expect(earned({ voteDates: [now] })).toEqual(["first-vote"]);
    expect(earned({ voteDates: [now], repsFound: true, floorVotes: 1, bestMatchCompared: 3 })).toEqual([
      "found-reps",
      "first-vote",
      "compared",
      "ahead",
    ]);
  });
});

describe("computeNextSteps", () => {
  const state: NextStepState = {
    signedIn: true,
    hasLocation: true,
    pulseCount: 0,
    floorCount: 0,
    fewestComparedWithRep: 0,
    votedToday: 0,
    dailyGoal: 3,
    streak: 0,
    votesCast: 0,
    followingCount: 0,
  };
  const ids = (input: Partial<NextStepState>) => computeNextSteps({ ...state, ...input }).map((s) => s.id);

  it("always offers something, in every situation", () => {
    for (const signedIn of [true, false]) {
      for (const hasLocation of [true, false]) {
        expect(computeNextSteps({ ...state, signedIn, hasLocation }).length).toBeGreaterThan(0);
      }
    }
  });

  it("starts signed-out people on the core idea", () => {
    expect(ids({ signedIn: false })[0]).toBe("sign-up");
  });

  it("finds reps first when there's no location", () => {
    expect(ids({ hasLocation: false, pulseCount: 5 })[0]).toBe("find-reps");
    expect(ids({ hasLocation: false, pulseCount: 5 })).not.toContain("pulse");
  });

  it("puts rep votes ahead of everything else", () => {
    expect(ids({ pulseCount: 2, floorCount: 3 })[0]).toBe("pulse");
  });

  it("says how close a verdict is", () => {
    const [step] = computeNextSteps({ ...state, pulseCount: 1, fewestComparedWithRep: 1 });
    expect(step.description).toContain("2 more");
  });

  it("nudges toward the daily goal once they've started", () => {
    expect(ids({ votedToday: 1 })).toContain("daily-goal");
    expect(ids({ votedToday: 0 })).not.toContain("daily-goal");
    expect(ids({ votedToday: 3 })).not.toContain("daily-goal");
  });

  it("stops suggesting a first follow once they follow something", () => {
    expect(ids({ followingCount: 1 })).not.toContain("follow");
  });
});

describe("policy areas", () => {
  it("covers the areas in real data", () => {
    for (const name of [
      "Public Lands and Natural Resources",
      "Armed Forces and National Security",
      "Health",
      "Civil Rights and Liberties, Minority Issues",
      "Science, Technology, Communications",
    ]) {
      expect(policyAreaByName(name), name).not.toBeNull();
    }
  });

  it("gives every area a unique address and a real family", () => {
    const slugs = POLICY_AREAS.map((area) => area.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const area of POLICY_AREAS) {
      expect(POLICY_FAMILIES[area.family]).toBeDefined();
      expect(area.explanation.length).toBeGreaterThan(10);
      expect(policyAreaBySlug(area.slug)).toBe(area);
    }
  });

  it("has exactly the 8 validated family colors", () => {
    expect(Object.keys(POLICY_FAMILIES)).toHaveLength(8);
  });

  it("handles an unknown or missing area without crashing", () => {
    expect(policyStyle(null).color).toBeTruthy();
    expect(policyStyle("Something New").color).toBeTruthy();
  });
});

describe("glossary", () => {
  it("defines every term it references", () => {
    for (const text of ["On motion to suspend the rules and pass", "Cloture motion", "Became Public Law No: 119-87."]) {
      const term = explainAction(text)?.term;
      expect(term && GLOSSARY[term], text).toBeTruthy();
    }
  });

  it("explains real action text correctly", () => {
    expect(explainAction("Became Public Law No: 119-87.")?.explanation).toBe("It's now the law.");
    expect(explainAction("Referred to the House Committee on Ways and Means.")?.term).toBe("referred");
    expect(explainAction("Presented to President.")?.term).toBe("veto");
    expect(explainAction("Passed/agreed to in House: On motion to suspend the rules and pass the bill")?.explanation).toContain("two-thirds");
  });

  it("returns nothing for wording it isn't sure about", () => {
    expect(explainAction("Mr. Smith asked unanimous consent to speak out of order.")).toBeNull();
  });

  it("states the key numbers correctly", () => {
    expect(GLOSSARY.cloture.short).toContain("60");
    expect(GLOSSARY["suspension-of-the-rules"].short).toContain("two-thirds");
    expect(GLOSSARY.veto.short).toContain("two-thirds");
  });
});
