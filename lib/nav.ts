// Which navigation link is active. Pure logic.

// A state's city pages belong to "My City", not "My State", though their URLs sit under the state.
const CITY_PAGES = /^\/state\/[^/]+\/(city|cities)(\/|$)/;

/** The path the nav treats a page as. */
export function navPathname(pathname: string): string {
  return CITY_PAGES.test(pathname) ? "/city" : pathname;
}

function matches(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one link to highlight for a URL. The longest match wins, so a parent link like /federal/bills
 * and a more specific one under it can never both light up.
 */
export function activeNavHref(rawPathname: string, hrefs: string[]): string | null {
  const pathname = navPathname(rawPathname);
  let best: string | null = null;
  for (const href of hrefs) {
    if (matches(pathname, href) && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

const GOVERNMENT_PAGES = /^\/(state|city)(\/|$)/;

/**
 * The active link among the ones someone can see. A state or city that isn't theirs has no "My State"
 * or "My City" link to light, so it counts as browsing States.
 */
export function activeVisibleHref(rawPathname: string, visibleHrefs: string[], statesHref = "/states"): string | null {
  const hit = activeNavHref(rawPathname, visibleHrefs);
  if (hit) return hit;
  return GOVERNMENT_PAGES.test(navPathname(rawPathname)) && visibleHrefs.includes(statesHref) ? statesHref : null;
}
