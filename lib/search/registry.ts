import type { Session } from "next-auth";
import { canAccess } from "@/lib/auth/permissions";
import { billsProvider } from "./providers/bills";
import { cityProviders } from "./providers/cities";
import { representativesProvider, senatorsProvider, stateLegislatorProviders } from "./providers/members";
import { glossaryProvider, pagesProvider, topicsProvider } from "./providers/static";
import { shortcutsProvider } from "./providers/shortcuts";
import { usersProvider } from "./providers/users";
import type { SearchProvider, SearchProviderInfo } from "./types";

// The order here is the order on screen. To search something new, add its provider to this list.
export const SEARCH_PROVIDERS: SearchProvider[] = [
  // Words like "mayor" or "town hall" first, because they mean the person's own.
  shortcutsProvider,
  pagesProvider,
  representativesProvider,
  senatorsProvider,
  ...stateLegislatorProviders,
  ...cityProviders,
  billsProvider,
  topicsProvider,
  glossaryProvider,
  usersProvider,
];

/** What this person is allowed to search. */
export function providersFor(session: Session | null): SearchProviderInfo[] {
  return SEARCH_PROVIDERS.filter((provider) => canAccess(session, provider.access ?? {})).map(
    ({ id, label, minQueryLength }) => ({ id, label, minQueryLength }),
  );
}

/** A provider, only if this person is allowed to use it. */
export function providerFor(id: string, session: Session | null): SearchProvider | null {
  const provider = SEARCH_PROVIDERS.find((item) => item.id === id);
  return provider && canAccess(session, provider.access ?? {}) ? provider : null;
}
