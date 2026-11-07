// Every government URL is built here, so pages never hand-write one.
//
// Each government lives under its own prefix: /federal now, and /state/{state} later. Things that
// belong to the person rather than a government, like /dashboard and /vote, stay at the root.

export const FEDERAL_BASE = "/federal";

/** A government's URL prefix. A state's would be `/state/tx`. */
export function jurisdictionBase(jurisdiction: "federal" | { state: string }): string {
  return jurisdiction === "federal" ? FEDERAL_BASE : `/state/${jurisdiction.state.toLowerCase()}`;
}

export const routes = {
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  vote: "/vote",
  leaderboard: "/leaderboard",
  progress: "/progress",
  reps: "/reps",
  learn: "/learn",
  settings: "/settings",
  /** Sends someone to their own state, or lists the states we cover. */
  myState: "/state",
  federal: {
    home: FEDERAL_BASE,
    bills: `${FEDERAL_BASE}/bills`,
    upcoming: `${FEDERAL_BASE}/upcoming`,
    legislators: `${FEDERAL_BASE}/legislators`,
    topics: `${FEDERAL_BASE}/topics`,
  },
} as const;

/** A state's pages. Which states exist is in lib/civic/states.ts. */
export function stateRoutes(stateKey: string) {
  const base = jurisdictionBase({ state: stateKey });
  return {
    home: base,
    bills: `${base}/bills`,
    legislators: `${base}/legislators`,
    events: `${base}/events`,
    city: (cityKey: string) => `${base}/city/${cityKey}`,
  };
}

/** Bill slugs start with their government: "us-119-hr-1". State slugs would start with "tx-". */
function baseOfSlug(slug: string): string {
  const prefix = slug.split("-", 1)[0];
  return prefix === "us" ? FEDERAL_BASE : jurisdictionBase({ state: prefix });
}

/** Someone's public page. By ID, because not everyone has a username. */
export function profilePath(userId: string): string {
  return `/users/${encodeURIComponent(userId)}`;
}

export function billPath(slug: string): string {
  return `${baseOfSlug(slug)}/bills/${slug}`;
}

export function billTextPath(slug: string): string {
  return `${billPath(slug)}/text`;
}

export function rollCallPath(slug: string, rollCallId: number | string): string {
  return `${billPath(slug)}/votes/${rollCallId}`;
}

/** From `memberKeyOf`: a Bioguide ID, or "ia:123" for a state legislator, prefixed by their state. */
export function memberPath(memberKey: string): string {
  const state = memberKey.match(/^([a-z]{2}):(.+)$/);
  if (state) return `${stateRoutes(state[1]).legislators}/${encodeURIComponent(state[2])}`;
  return `${routes.federal.legislators}/${memberKey}`;
}

export function eventPath(stateKey: string, id: number): string {
  return `${stateRoutes(stateKey).events}/${id}`;
}

export function topicPath(slug: string): string {
  return `${routes.federal.topics}/${slug}`;
}
