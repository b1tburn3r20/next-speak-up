import { describe, expect, it } from "vitest";
import { buildGlossaryIndex, segmentText, type GlossaryRow, type Segment } from "@/lib/glossary/match";

const ROWS: GlossaryRow[] = [
  ["cloture", "How the Senate ends debate."],
  ["motion to recommit", "A last attempt to send a bill back."],
  ["recommit", "To send back to committee."],
  ["amendment", "A proposed change."],
  ["U.S.C.", "The United States Code."],
  ["CRA", "The Congressional Review Act."],
  ["CRA", "The Community Reinvestment Act."],
  ["appropriations", "Money Congress sets aside."],
];
const index = buildGlossaryIndex(ROWS);
const marked = (segments: Segment[]) => segments.flatMap((segment) => (typeof segment === "string" ? [] : [`${segment.text}=${segment.key}`]));

describe("buildGlossaryIndex", () => {
  it("puts a word's meanings together", () => {
    expect(index.words.get("cra")?.definitions).toHaveLength(2);
    expect(index.words.get("usc")?.keyword).toBe("U.S.C.");
  });
});

describe("segmentText", () => {
  it("marks words and phrases, longest first, and keeps every other character", () => {
    const text = "After cloture, a motion to recommit failed.";
    const segments = segmentText(text, index);
    expect(marked(segments)).toEqual(["cloture=cloture", "motion to recommit=motion to recommit"]);
    expect(segments.map((segment) => (typeof segment === "string" ? segment : segment.text)).join("")).toBe(text);
  });

  it("ignores case, finds plurals, and leaves a sentence's period out", () => {
    expect(marked(segmentText("Two Amendments passed. Cloture.", index))).toEqual(["Amendments=amendment", "Cloture=cloture"]);
  });

  it("keeps an abbreviation's periods, and matches acronyms only in capitals", () => {
    expect(marked(segmentText("Under 42 U.S.C. 1983, the CRA applies.", index))).toEqual(["U.S.C.=usc", "CRA=cra"]);
    expect(marked(segmentText("a cra of light", index))).toEqual([]);
  });

  it("marks a word's first use only, across blocks that share what's been seen", () => {
    const seen = new Set<string>();
    expect(marked(segmentText("cloture and cloture", index, seen))).toEqual(["cloture=cloture"]);
    expect(marked(segmentText("then cloture again", index, seen))).toEqual([]);
    expect(marked(segmentText("cloture and cloture", index, new Set(), true))).toHaveLength(2);
  });

  it("doesn't match inside other words", () => {
    expect(marked(segmentText("Clotures? Recommitted. Amendmentless.", index))).toEqual(["Clotures=cloture"]);
  });

  it("returns the text as is with an empty glossary", () => {
    expect(segmentText("cloture", buildGlossaryIndex([]))).toEqual(["cloture"]);
  });
});
