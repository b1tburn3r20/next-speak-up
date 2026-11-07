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
  federal: {
    home: FEDERAL_BASE,
    bills: `${FEDERAL_BASE}/bills`,
    upcoming: `${FEDERAL_BASE}/upcoming`,
    legislators: `${FEDERAL_BASE}/legislators`,
    topics: `${FEDERAL_BASE}/topics`,
  },
} as const;

/** Iowa is the only state so far. Adding one means its pipelines, and a line in `SUPPORTED_STATES`. */
const IOWA_BASE = jurisdictionBase({ state: "ia" });
export const stateRoutes = {
  home: IOWA_BASE,
  bills: `${IOWA_BASE}/bills`,
  legislators: `${IOWA_BASE}/legislators`,
  events: `${IOWA_BASE}/events`,
  city: `${IOWA_BASE}/city/des-moines`,
} as const;

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

/** From `memberKeyOf`: a Bioguide ID, or "ia:123" for an Iowa legislator. */
export function memberPath(memberKey: string): string {
  if (memberKey.startsWith("ia:")) return `${stateRoutes.legislators}/${memberKey.slice(3)}`;
  return `${routes.federal.legislators}/${memberKey}`;
}

export function eventPath(id: number): string {
  return `${stateRoutes.events}/${id}`;
}

export function topicPath(slug: string): string {
  return `${routes.federal.topics}/${slug}`;
}
