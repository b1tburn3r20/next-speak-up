import { describe, expect, it } from "vitest";
import {
  billHtmlToText,
  isFetchableTextUrl,
  clampText,
  htmlToPlainText,
  pickLatestTextVersion,
  prepareChatHistory,
} from "@/lib/civic/bill-text-logic";
import { summarizeSponsoredBills } from "@/lib/civic/member-record";

const version = (versionType: string, issuedOn: string | null) => ({
  versionType,
  issuedOn: issuedOn ? new Date(issuedOn) : null,
});

describe("pickLatestTextVersion", () => {
  it("prefers Public Law, even though an Enrolled Bill has no date", () => {
    // The real shape of S. 4465.
    const latest = pickLatestTextVersion([
      version("Enrolled Bill", null),
      version("Considered and Passed Senate", "2026-04-30"),
      version("Public Law", "2026-05-01"),
    ]);
    expect(latest?.versionType).toBe("Public Law");
  });

  it("treats an undated Enrolled Bill as newer than dated versions", () => {
    const latest = pickLatestTextVersion([
      version("Engrossed in Senate", "2026-04-30"),
      version("Enrolled Bill", null),
    ]);
    expect(latest?.versionType).toBe("Enrolled Bill");
  });

  it("otherwise picks the latest date", () => {
    const latest = pickLatestTextVersion([
      version("Introduced in House", "2026-01-01"),
      version("Reported in House", "2026-03-01"),
    ]);
    expect(latest?.versionType).toBe("Reported in House");
  });

  it("returns null with no versions", () => {
    expect(pickLatestTextVersion([])).toBeNull();
  });
});

describe("htmlToPlainText", () => {
  it("removes tags, keeps paragraphs apart, and decodes entities", () => {
    expect(htmlToPlainText("<p><b>This</b> bill &amp; that.</p><ul><li>One</li></ul>")).toBe(
      "This bill & that.\nOne",
    );
  });
});

describe("billHtmlToText", () => {
  it("keeps a bill's line breaks and indents, and drops markup, scripts, and the title", () => {
    const page =
      "<html><head><title>BILLS</title><style>x{}</style><script>alert(1)</script></head><body><pre>\r\n" +
      "SECTION 1. SHORT TITLE.   \r\n\r\n\r\n\r\n  This Act may be cited as the &quot;Test Act&quot; &amp; more.\r\n</pre></body></html>";
    expect(billHtmlToText(page)).toBe('SECTION 1. SHORT TITLE.\n\n  This Act may be cited as the "Test Act" & more.');
  });
});

describe("isFetchableTextUrl", () => {
  it("only lets the server fetch bill text from Congress.gov or GovInfo, over https", () => {
    expect(isFetchableTextUrl("https://www.congress.gov/119/bills/s5533/BILLS-119s5533is.htm")).toBe(true);
    expect(isFetchableTextUrl("https://www.govinfo.gov/content/pkg/BILLS-119hr1ih/html/BILLS-119hr1ih.htm")).toBe(true);
    expect(isFetchableTextUrl("http://www.congress.gov/119/bills/x.htm")).toBe(false);
    expect(isFetchableTextUrl("https://congress.gov.evil.example/x.htm")).toBe(false);
    expect(isFetchableTextUrl("https://127.0.0.1/x")).toBe(false);
    expect(isFetchableTextUrl("not a url")).toBe(false);
    expect(isFetchableTextUrl(null)).toBe(false);
  });
});

describe("clampText", () => {
  it("leaves short text alone", () => {
    expect(clampText("Short.", 100)).toEqual({ text: "Short.", truncated: false });
  });

  it("cuts at a sentence when there's one nearby", () => {
    const { text, truncated } = clampText("First sentence here. Second sentence goes on", 30);
    expect(text).toBe("First sentence here.");
    expect(truncated).toBe(true);
  });

  it("cuts at a word when there's no sentence", () => {
    expect(clampText("one two three four five six", 12).text).toBe("one two");
  });
});

describe("prepareChatHistory", () => {
  it("drops assistant messages before the first question", () => {
    expect(
      prepareChatHistory([
        { role: "assistant", content: "Hi" },
        { role: "user", content: "Q" },
      ]),
    ).toEqual([{ role: "user", content: "Q" }]);
  });

  it("keeps only the latest messages, still starting with the user", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: String(index),
    }));
    const kept = prepareChatHistory(messages, 5);
    expect(kept[0].role).toBe("user");
    expect(kept.at(-1)?.content).toBe("11");
  });

  it("gives nothing back when there's no question", () => {
    expect(prepareChatHistory([{ role: "assistant", content: "Hi" }])).toEqual([]);
  });
});

describe("summarizeSponsoredBills", () => {
  it("counts how far bills got and what they're about", () => {
    const record = summarizeSponsoredBills([
      { policyArea: "Energy", currentStatus: "BECAME_LAW" },
      { policyArea: "Energy", currentStatus: "IN_COMMITTEE" },
      { policyArea: "Taxation", currentStatus: "PASSED_ORIGIN_CHAMBER" },
      { policyArea: null, currentStatus: "INTRODUCED" },
    ]);
    expect(record).toMatchObject({ sponsored: 4, advanced: 2, becameLaw: 1, lawPercent: 25 });
    expect(record.byPolicyArea[0]).toEqual({ policyArea: "Energy", count: 2, percent: 67 });
  });

  it("says no data rather than 0% for someone with no bills", () => {
    expect(summarizeSponsoredBills([]).lawPercent).toBeNull();
  });

  it("limits the policy list to eight", () => {
    const bills = Array.from({ length: 12 }, (_, index) => ({
      policyArea: `Area ${index}`,
      currentStatus: "INTRODUCED",
    }));
    expect(summarizeSponsoredBills(bills).byPolicyArea).toHaveLength(8);
  });
});
