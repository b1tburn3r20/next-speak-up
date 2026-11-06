// Things that are the same for everyone and live in code, so they're scored without the database.

import { navItems } from "@/app/data/navbar-data";
import { canAccess } from "@/lib/auth/permissions";
import { GLOSSARY } from "@/lib/civic/glossary";
import { POLICY_AREAS } from "@/lib/civic/policy-areas";
import { routes, topicPath } from "@/lib/routes";
import { rankResults, scoreFields } from "../score";
import type { SearchProvider } from "../types";

export const pagesProvider: SearchProvider = {
  id: "pages",
  label: "Go to",
  minQueryLength: 0,
  search: async ({ query, session, limit }) => {
    const pages = navItems
      .filter((item) => canAccess(session, item))
      .flatMap((item) => [item, ...(item.children ?? [])]);
    return rankResults(
      pages.map((page) => ({
        id: page.href,
        title: page.label,
        href: page.href,
        // With nothing typed yet, every page is a suggestion.
        score: query ? scoreFields(query, [{ text: page.label }]) : 0.5,
      })),
      query ? limit : 5,
    );
  },
};

export const topicsProvider: SearchProvider = {
  id: "topics",
  label: "Topics",
  minQueryLength: 2,
  search: async ({ query, limit }) =>
    rankResults(
      POLICY_AREAS.map((area) => ({
        id: area.slug,
        title: area.name,
        subtitle: area.explanation,
        href: topicPath(area.slug),
        policyArea: area.name,
        score: scoreFields(query, [{ text: area.name }, { text: area.explanation, weight: 0.6 }]),
      })),
      limit,
    ),
};

export const glossaryProvider: SearchProvider = {
  id: "glossary",
  label: "Words explained",
  minQueryLength: 2,
  search: async ({ query, limit }) =>
    rankResults(
      Object.entries(GLOSSARY).map(([id, entry]) => ({
        id,
        title: entry.term,
        subtitle: entry.short,
        href: `${routes.learn}#${id}`,
        score: scoreFields(query, [{ text: entry.term }, { text: entry.short, weight: 0.4 }]),
      })),
      limit,
    ),
};
