// The glossary in the browser: the rows the server cached, turned into a lookup index once.
//
// Made per page tree by `GlossaryProvider`, not as a module-level store, so the server can render with
// it too (a shared module store would leak between requests) and the first paint already has underlines.
import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { buildGlossaryIndex, type GlossaryIndex, type GlossaryRow } from "@/lib/glossary/match";

export type GlossaryState = {
  index: GlossaryIndex;
  /** The rows the index was built from, so the same list isn't indexed twice. */
  rows: GlossaryRow[];
  setRows: (rows: GlossaryRow[]) => void;
};

export function createGlossaryStore(rows: GlossaryRow[]): StoreApi<GlossaryState> {
  return createStore<GlossaryState>((set, get) => ({
    index: buildGlossaryIndex(rows),
    rows,
    setRows: (next) => {
      if (next === get().rows) return;
      set({ rows: next, index: buildGlossaryIndex(next) });
    },
  }));
}

export const GlossaryStoreContext = createContext<StoreApi<GlossaryState> | null>(null);

const EMPTY = buildGlossaryIndex([]);

/** The index, or an empty one outside a provider, which just means nothing is underlined. */
export function useGlossaryIndex(): GlossaryIndex {
  const store = useContext(GlossaryStoreContext);
  return useStore(store ?? FALLBACK, (state) => state.index);
}

const FALLBACK = createStore<GlossaryState>(() => ({ index: EMPTY, rows: [], setRows: () => undefined }));
