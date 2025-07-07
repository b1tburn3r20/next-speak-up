import { create } from "zustand";

export type FeatureSuggestionStore = {
  feature: string;
  setFeature: (data: string) => void;

  //
  isFeatureSuggestionDialogOpen: boolean;
  setIsFeatureSuggestionDialogOpen: (data: boolean) => void;

  resetFeatureSuggestionStore: () => void;
};

const initialState = {
  feature: "",
  isFeatureSuggestionDialogOpen: false,
};
export const useFeatureSuggestionStore = create<FeatureSuggestionStore>(
  (set) => ({
    ...initialState,
    setIsFeatureSuggestionDialogOpen: (data: boolean) =>
      set({ isFeatureSuggestionDialogOpen: data }),
    resetFeatureSuggestionStore: () => set({ ...initialState }),
    setFeature: (data: string) => set({ feature: data }),
  })
);
