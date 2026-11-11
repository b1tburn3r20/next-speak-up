"use client";

import { useEffect, useState } from "react";
import type { GlossaryRow } from "@/lib/glossary/match";
import { createGlossaryStore, GlossaryStoreContext } from "@/stores/use-glossary-store";

/** Holds the glossary for everything under it. The layout gives it the server's cached rows. */
export function GlossaryProvider({ rows, children }: { rows: GlossaryRow[]; children: React.ReactNode }) {
  const [store] = useState(() => createGlossaryStore(rows));
  // After an admin edit, the next page the layout renders carries the new rows.
  useEffect(() => {
    store.getState().setRows(rows);
  }, [rows, store]);
  return <GlossaryStoreContext.Provider value={store}>{children}</GlossaryStoreContext.Provider>;
}
