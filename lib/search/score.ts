// How well a piece of text matches what someone typed, from 0 (no match) to 1 (exact). Pure logic.
//
// A hand-written ranking, because the order people expect isn't what a database gives back. Someone
// typing "bar" wants "Barrasso" before "Crowbar", and "barraso" should still find him.

export const SCORE = {
  EXACT: 1,
  STARTS_WITH: 0.92,
  WORD_START: 0.82,
  INITIALS: 0.74,
  CONTAINS: 0.62,
  FUZZY_MAX: 0.5,
  TYPO: 0.42,
} as const;

/** Lowercase, no accents, and punctuation as spaces, so "H.R. 12" and "hr 12" look alike. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Every letter in order. Letters close together, and early on, score higher. */
function subsequenceScore(query: string, target: string): number {
  let position = -1;
  let first = -1;
  let gaps = 0;
  for (const letter of query) {
    const found = target.indexOf(letter, position + 1);
    if (found === -1) return 0;
    if (first === -1) first = found;
    else gaps += found - position - 1;
    position = found;
  }
  // Letters scattered across a long title aren't a match anyone meant.
  if (gaps > query.length * 2) return 0;
  const closeness = 1 / (1 + gaps);
  const earliness = 1 / (1 + first / 10);
  return 0.2 + (SCORE.FUZZY_MAX - 0.2) * closeness * earliness;
}

/** Whether two words are one typo apart: a wrong, missing, extra, or swapped letter. */
function oneTypoApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  const restA = a.slice(start);
  const restB = b.slice(start);
  return (
    restA.slice(1) === restB.slice(1) ||
    restA.slice(1) === restB ||
    restA === restB.slice(1) ||
    (restA[0] === restB[1] && restA[1] === restB[0] && restA.slice(2) === restB.slice(2))
  );
}

/** One typed word against text that's already normalized. */
function scoreWord(word: string, target: string, words: string[]): number {
  if (target === word) return SCORE.EXACT;
  if (target.startsWith(word)) return SCORE.STARTS_WITH;
  if (words.includes(word)) return SCORE.WORD_START + 0.05;
  if (words.some((item) => item.startsWith(word))) return SCORE.WORD_START;
  if (word.length >= 2 && words.map((item) => item[0]).join("").startsWith(word)) return SCORE.INITIALS;
  if (target.includes(word)) return SCORE.CONTAINS;
  // Short words match too many things by accident.
  if (word.length < 3) return 0;
  if (word.length >= 4 && words.some((item) => oneTypoApart(word, item))) return SCORE.TYPO;
  return subsequenceScore(word, target);
}

/** Scores text against a query. Every typed word has to match, or it's no match at all. */
export function commandScore(query: string, text: string): number {
  const typed = normalize(query);
  const target = normalize(text);
  if (!typed || !target) return 0;
  if (target === typed) return SCORE.EXACT;
  if (target.startsWith(typed)) return SCORE.STARTS_WITH;
  const words = target.split(" ");
  const parts = typed.split(" ");
  let total = 0;
  for (const part of parts) {
    const score = scoreWord(part, target, words);
    if (score === 0) return 0;
    total += score;
  }
  // A phrase in the right order is better than the same words scattered around.
  const inOrder = target.includes(typed) ? 0.04 : 0;
  // Multiple words can't be an exact match, and only the checks above can earn that.
  return Math.min(SCORE.STARTS_WITH - 0.01, total / parts.length + inOrder);
}

export type ScoredField = { text: string | null | undefined; weight?: number };

/**
 * Scores a record with several fields, like a member's name, state, and party. Each typed word can
 * match a different field, so "ted texas" works. Every word has to match somewhere.
 */
export function scoreFields(query: string, fields: ScoredField[]): number {
  const usable = fields.flatMap((field) => (field.text ? [{ text: field.text, weight: field.weight ?? 1 }] : []));
  // The whole query against one field is the best kind of match.
  const whole = Math.max(0, ...usable.map((field) => commandScore(query, field.text) * field.weight));
  const parts = normalize(query).split(" ").filter(Boolean);
  if (parts.length < 2) return whole;
  let total = 0;
  for (const part of parts) {
    const best = Math.max(0, ...usable.map((field) => commandScore(part, field.text) * field.weight));
    if (best === 0) return whole;
    total += best;
  }
  return Math.max(whole, (total / parts.length) * 0.95);
}

/** Keeps what matched, best first. Ties stay in the order they came in. */
export function rankResults<T extends { score: number }>(results: T[], limit: number): T[] {
  return results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.score > 0)
    .sort((a, b) => b.result.score - a.result.score || a.index - b.index)
    .slice(0, limit)
    .map(({ result }) => result);
}
