import { describe, expect, it } from "vitest";
import { decodeEntities, parseSimpleHtml } from "@/lib/glossary/simple-html";

describe("parseSimpleHtml", () => {
  it("builds the tree of a sanitized summary", () => {
    expect(parseSimpleHtml("<p>This <strong>bill</strong> does</p><ul><li>one</li><li>two</li></ul>")).toEqual([
      { tag: "p", children: ["This ", { tag: "strong", children: ["bill"] }, " does"] },
      { tag: "ul", children: [{ tag: "li", children: ["one"] }, { tag: "li", children: ["two"] }] },
    ]);
  });

  it("decodes entities, and keeps text from tags it doesn't allow", () => {
    expect(parseSimpleHtml("<p>A &amp; B&#39;s <script>x</script><br/>end</p>")).toEqual([
      { tag: "p", children: ["A & B's ", "x", { tag: "br", children: [] }, "end"] },
    ]);
    expect(decodeEntities("&nbsp;&lt;&#x41;&bogus;")).toBe(" <A&bogus;");
  });

  it("survives a tag that's never closed", () => {
    expect(parseSimpleHtml("<p>one<p>two")).toEqual([{ tag: "p", children: ["one", { tag: "p", children: ["two"] }] }]);
  });
});
