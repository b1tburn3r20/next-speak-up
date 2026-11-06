import type { Session } from "next-auth";
import type { NavAccess } from "@/lib/auth/permissions";

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Between 0 and 1, from `commandScore`. Results are sorted by this within their group. */
  score: number;
  /** A person's picture, or a policy area's color and icon. Both are optional. */
  person?: { name: string; imageUrl: string | null; party: string | null };
  policyArea?: string | null;
  /** A short label before the title, like "H.R. 12". */
  badge?: string;
};

export type SearchContext = {
  query: string;
  session: Session | null;
  limit: number;
};

/**
 * One kind of thing you can search for. To add one, write a provider and list it in `registry.ts`.
 * Each is fetched on its own, so a slow one shows a skeleton while the rest appear.
 */
export type SearchProvider = {
  id: string;
  /** The group's heading. */
  label: string;
  /** Who can search this. Checked on the server for every request. */
  access?: NavAccess;
  /** Below this many letters, it isn't asked. 0 means it also shows before anything's typed. */
  minQueryLength: number;
  search: (context: SearchContext) => Promise<SearchResult[]>;
};

/** What the browser is told about a provider. */
export type SearchProviderInfo = Pick<SearchProvider, "id" | "label" | "minQueryLength">;
