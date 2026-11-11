// Turns already-sanitized summary HTML (a handful of tags, no attributes) into a small tree, so its
// words can be matched and rendered as React elements instead of injected HTML. Pure logic.

export const SIMPLE_TAGS = ["p", "strong", "em", "b", "i", "ul", "ol", "li", "br"] as const;
export type SimpleTag = (typeof SIMPLE_TAGS)[number];
export type SimpleNode = string | { tag: SimpleTag; children: SimpleNode[] };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

const isTag = (name: string): name is SimpleTag => (SIMPLE_TAGS as readonly string[]).includes(name);

/** Anything not on the list is dropped, keeping its text, so this is safe even on unexpected input. */
export function parseSimpleHtml(html: string): SimpleNode[] {
  const root: { children: SimpleNode[] } = { children: [] };
  const stack: { tag: SimpleTag | null; children: SimpleNode[] }[] = [{ tag: null, children: root.children }];
  for (const part of html.split(/(<\/?[a-z0-9]+\s*\/?>)/i)) {
    if (!part) continue;
    const tag = part.match(/^<(\/?)([a-z0-9]+)\s*(\/?)>$/i);
    if (!tag) {
      const text = decodeEntities(part);
      if (text) stack[stack.length - 1].children.push(text);
      continue;
    }
    const [, closing, rawName] = tag;
    const name = rawName.toLowerCase();
    if (!isTag(name)) continue;
    if (name === "br") {
      stack[stack.length - 1].children.push({ tag: "br", children: [] });
    } else if (closing) {
      const at = stack.map((entry) => entry.tag).lastIndexOf(name);
      if (at > 0) stack.length = at;
    } else {
      const node = { tag: name, children: [] as SimpleNode[] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
  }
  return root.children;
}
