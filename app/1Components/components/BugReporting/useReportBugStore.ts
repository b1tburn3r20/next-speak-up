import { create } from "zustand";

export type ReportBugStore = {
  bug: string;
  setBug: (data: string) => void;

  //
  isBugDialogOpen: boolean;
  setIsBugDialogOpen: (data: boolean) => void;

  resetBugStore: () => void;
};

const initialState = {
  bug: "",
  isBugDialogOpen: false,
};
export const useReportBugStore = create<ReportBugStore>((set) => ({
  ...initialState,
  setIsBugDialogOpen: (data: boolean) => set({ isBugDialogOpen: data }),
  resetBugStore: () => set({ ...initialState }),
  setBug: (data: string) => set({ bug: data }),
}));
