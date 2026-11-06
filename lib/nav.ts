// Which navigation link is active. Pure logic.

function matches(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one link to highlight for a URL. The longest match wins, so a parent link like /federal/bills
 * and a more specific one under it can never both light up.
 */
export function activeNavHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (matches(pathname, href) && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
