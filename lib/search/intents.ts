// Words people search for that mean a thing in their own life, like "mayor" or "town hall", rather
// than a name. Each maps to an intent, and the search provider fills it in with that person's own
// mayor, City Hall, or meeting. Pure logic.

import { normalize } from "./score";

export type IntentId =
  | "mayor"
  | "city-hall"
  | "meeting"
  | "council"
  | "my-reps"
  | "state-legislators"
  | "upcoming"
  | "notifications"
  | "where-i-live"
  | "progress";

/** The words for each intent, in plain forms people type. Order is the order they're shown in. */
export const INTENTS: { id: IntentId; keywords: string[] }[] = [
  { id: "mayor", keywords: ["mayor", "my mayor"] },
  { id: "meeting", keywords: ["town hall", "town hall meeting", "council meeting", "city meeting", "meeting", "agenda", "public comment", "speak at a meeting", "speak"] },
  { id: "city-hall", keywords: ["city hall", "town hall", "my city", "city clerk", "clerk", "city office"] },
  { id: "council", keywords: ["city council", "council", "council member", "councilman", "councilwoman", "alderman", "ward"] },
  { id: "my-reps", keywords: ["my rep", "my reps", "my representative", "representative", "congressman", "congresswoman", "my senator", "senators", "who represents me"] },
  { id: "state-legislators", keywords: ["state senator", "state representative", "state rep", "legislator", "statehouse", "legislature", "state house", "state senate"] },
  { id: "upcoming", keywords: ["this week", "upcoming", "upcoming votes", "schedule", "floor"] },
  { id: "notifications", keywords: ["notifications", "notification", "reminders", "remind me", "alerts"] },
  { id: "where-i-live", keywords: ["address", "where i live", "change address", "moved", "zip code", "zip", "location"] },
  { id: "progress", keywords: ["streak", "xp", "level", "badges", "rank", "progress"] },
];

export const MIN_INTENT_QUERY = 3;

/** How well a query asks for one keyword: exactly, as its start, or with it inside a longer phrase. */
function keywordScore(query: string, keyword: string): number {
  if (query === keyword) return 1;
  // "may" for "mayor", but a couple of letters match too much.
  if (query.length >= MIN_INTENT_QUERY && keyword.startsWith(query)) return 0.85 * Math.min(1, query.length / keyword.length + 0.4);
  // "des moines city hall", or "who is my mayor".
  if (` ${query} `.includes(` ${keyword} `)) return 0.9;
  return 0;
}

/** The intents a query asks for, best first. Nothing below three letters. */
export function matchIntents(raw: string): { id: IntentId; score: number }[] {
  const query = normalize(raw);
  if (query.length < MIN_INTENT_QUERY) return [];
  return INTENTS.map(({ id, keywords }) => ({ id, score: Math.max(0, ...keywords.map((keyword) => keywordScore(query, keyword))) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}
