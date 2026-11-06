import { create } from "zustand";

/** Whether the search dialog is open, so any button anywhere can open the one dialog. */
export const useSearchStore = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
