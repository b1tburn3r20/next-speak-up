// The glossary's one copy on the server: every row, cached for a week, and refreshed the moment an
// admin changes it. Pages hand the rows to the browser once, where `GlossaryProvider` holds them.
import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "@/prisma/client";
import type { GlossaryRow } from "./match";

export const GLOSSARY_TAG = "glossary";
const WEEK_SECONDS = 7 * 24 * 60 * 60;
export const KEYWORD_MAX = 80;
export const DEFINITION_MAX = 500;

const loadRows = unstable_cache(
  async (): Promise<GlossaryRow[]> => {
    const rows = await prisma.glossaryTerm.findMany({ orderBy: [{ keyword: "asc" }, { id: "asc" }], select: { keyword: true, definition: true } });
    return rows.map((row) => [row.keyword, row.definition]);
  },
  ["glossary-rows"],
  { revalidate: WEEK_SECONDS, tags: [GLOSSARY_TAG] },
);

/** Every keyword and definition. A failure means no underlines, never a broken page. */
export async function getGlossaryRows(): Promise<GlossaryRow[]> {
  try {
    return await loadRows();
  } catch {
    return [];
  }
}

/** Everything, with ids, for the admin page. Read straight from the database, not the cache. */
export async function listGlossaryTerms() {
  return prisma.glossaryTerm.findMany({ orderBy: [{ keyword: "asc" }, { id: "asc" }], select: { id: true, keyword: true, definition: true, updatedAt: true } });
}

/** Drops the cached copy right away, so the next page shows the change. */
export function glossaryChanged() {
  revalidateTag(GLOSSARY_TAG, { expire: 0 });
}

export async function createGlossaryTerm(keyword: string, definition: string, userId: string) {
  const row = await prisma.glossaryTerm.create({ data: { keyword, definition, updatedById: userId } });
  glossaryChanged();
  return row;
}

export async function updateGlossaryTerm(id: number, keyword: string, definition: string, userId: string) {
  const changed = await prisma.glossaryTerm.updateMany({ where: { id }, data: { keyword, definition, updatedById: userId } });
  if (changed.count > 0) glossaryChanged();
  return changed.count > 0;
}

export async function deleteGlossaryTerm(id: number) {
  const removed = await prisma.glossaryTerm.deleteMany({ where: { id } });
  if (removed.count > 0) glossaryChanged();
  return removed.count > 0;
}
