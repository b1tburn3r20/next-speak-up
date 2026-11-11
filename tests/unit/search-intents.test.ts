import { describe, expect, it } from "vitest";
import { matchIntents } from "@/lib/search/intents";

const ids = (query: string) => matchIntents(query).map((match) => match.id);

describe("matchIntents", () => {
  it("turns words about someone's own places into intents", () => {
    expect(ids("mayor")[0]).toBe("mayor");
    expect(ids("City Hall")[0]).toBe("city-hall");
    expect(ids("council meeting")[0]).toBe("meeting");
  });

  it("lets town hall mean both the meeting and the building", () => {
    expect(ids("town hall")).toEqual(expect.arrayContaining(["meeting", "city-hall"]));
  });

  it("finds a keyword inside a longer question, and from its first letters", () => {
    expect(ids("who is my mayor")).toContain("mayor");
    expect(ids("des moines city hall")).toContain("city-hall");
    expect(ids("may")).toContain("mayor");
  });

  it("ignores two letters and names it doesn't know", () => {
    expect(matchIntents("ma")).toEqual([]);
    expect(matchIntents("Barrasso")).toEqual([]);
  });

  it("ranks an exact keyword above a partial one", () => {
    const [first, second] = matchIntents("council");
    expect(first.id).toBe("council");
    expect(first.score).toBe(1);
    if (second) expect(second.score).toBeLessThan(1);
  });
});
