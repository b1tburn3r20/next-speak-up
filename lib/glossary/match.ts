// Finds glossary words in a block of text, in one pass. Pure logic, used on the server and in the browser.
//
// The index is built once from the whole list: a map from each phrase's first word to the phrases that
// start with it, longest first. Reading the text is then one lookup per word, so a long summary costs
// about the same as a short one, however big the glossary gets.

/** As stored and sent to the browser: [keyword, definition]. A keyword with two meanings has two rows. */
export type GlossaryRow = [keyword: string, definition: string];

export type GlossaryWord = { keyword: string; definitions: string[] };

type Phrase = { key: string; words: string[]; acronym: boolean };

export type GlossaryIndex = {
  byFirstWord: Map<string, Phrase[]>;
  words: Map<string, GlossaryWord>;
};

export type Segment = string | { text: string; key: string };

/** Lowercase, without periods or apostrophes, so "U.S.C." and "USC" are the same word. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[.'’]/g, "");
}

// A word: letters and digits, with dots, apostrophes, or hyphens inside ("U.S.C.", "pay-as-you-go").
const WORD = /[A-Za-z0-9]+(?:[.'’-][A-Za-z0-9]+)*\.?/g;

/** All capitals, like "CBO" or "U.S.C.": matched only in capitals, so "cra" in a sentence isn't CRA. */
function isAcronym(keyword: string): boolean {
  const letters = keyword.replace(/[^A-Za-z]/g, "");
  return letters.length >= 2 && letters.length <= 8 && letters === letters.toUpperCase();
}

function wordsOf(text: string): string[] {
  return (text.match(WORD) ?? []).map(normalizeWord);
}

export function buildGlossaryIndex(rows: GlossaryRow[]): GlossaryIndex {
  const words = new Map<string, GlossaryWord>();
  const byFirstWord = new Map<string, Phrase[]>();
  for (const [keyword, definition] of rows) {
    const parts = wordsOf(keyword);
    if (parts.length === 0) continue;
    const key = parts.join(" ");
    const held = words.get(key);
    if (held) {
      if (!held.definitions.includes(definition)) held.definitions.push(definition);
      continue;
    }
    words.set(key, { keyword: keyword.trim(), definitions: [definition] });
    const list = byFirstWord.get(parts[0]) ?? [];
    list.push({ key, words: parts, acronym: isAcronym(keyword) });
    byFirstWord.set(parts[0], list);
  }
  for (const list of byFirstWord.values()) list.sort((a, b) => b.words.length - a.words.length);
  return { byFirstWord, words };
}

/** "amendments" finds "amendment", and "vetoes" finds "veto". */
function forms(word: string): string[] {
  const found = [word];
  if (word.length > 3 && word.endsWith("es")) found.push(word.slice(0, -2));
  if (word.length > 2 && word.endsWith("s")) found.push(word.slice(0, -1));
  return found;
}

type Token = { start: number; end: number; raw: string; norm: string };

function tokens(text: string): Token[] {
  const found: Token[] = [];
  for (const match of text.matchAll(WORD)) {
    let raw = match[0];
    // A sentence's last period isn't part of the word, unless the word is an abbreviation like "U.S.C.".
    if (raw.endsWith(".") && !raw.slice(0, -1).includes(".")) raw = raw.slice(0, -1);
    const start = match.index ?? 0;
    found.push({ start, end: start + raw.length, raw, norm: normalizeWord(raw) });
  }
  return found;
}

const isCapitals = (raw: string) => {
  const letters = raw.replace(/[^A-Za-z]/g, "");
  return letters.length > 0 && letters === letters.toUpperCase();
};

/** The phrase that starts at this word, if any, longest first. */
function phraseAt(list: Token[], at: number, index: GlossaryIndex): { phrase: Phrase; length: number } | null {
  const first = list[at];
  for (const form of forms(first.norm)) {
    for (const phrase of index.byFirstWord.get(form) ?? []) {
      if (at + phrase.words.length > list.length) continue;
      let fits = true;
      for (let offset = 0; offset < phrase.words.length; offset += 1) {
        const token = list[at + offset];
        // Only a phrase's last word can be plural: "motions to recommit" isn't a thing anyone writes.
        const wanted = offset === 0 ? form : phrase.words[offset];
        const accepted = offset === phrase.words.length - 1 && offset > 0 ? forms(token.norm) : [token.norm];
        if (offset === 0 ? !forms(token.norm).includes(wanted) : !accepted.includes(wanted)) {
          fits = false;
          break;
        }
        if (phrase.acronym && !isCapitals(token.raw)) {
          fits = false;
          break;
        }
      }
      if (fits) return { phrase, length: phrase.words.length };
    }
  }
  return null;
}

/**
 * Splits text into plain runs and glossary words. By default only a word's first use is marked, so a
 * summary isn't a wall of underlines. `seen` carries that across several blocks on one page.
 */
export function segmentText(text: string, index: GlossaryIndex, seen: Set<string> = new Set(), everyUse = false): Segment[] {
  if (!text || index.words.size === 0) return text ? [text] : [];
  const list = tokens(text);
  const segments: Segment[] = [];
  let cursor = 0;
  for (let at = 0; at < list.length; at += 1) {
    const found = phraseAt(list, at, index);
    if (!found) continue;
    const { phrase, length } = found;
    if (!everyUse && seen.has(phrase.key)) {
      at += length - 1;
      continue;
    }
    seen.add(phrase.key);
    const start = list[at].start;
    const end = list[at + length - 1].end;
    if (start > cursor) segments.push(text.slice(cursor, start));
    segments.push({ text: text.slice(start, end), key: phrase.key });
    cursor = end;
    at += length - 1;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}
