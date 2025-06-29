import { create } from "zustand";
import { FullUserLegislationData } from "@/lib/types/bill-types";

export type BillPageStore = {
  billData: FullUserLegislationData | null;
  isDyslexicFriendly: boolean;
  currentAiSummary: string | null;
  currentOfficialSummary: string | null;
  //
  setBillData: (data: FullUserLegislationData) => void;
  setIsDyslexicFriendly: (data: boolean) => void;
  setCurrentAiSummary: (date: string | null) => void;
  setCurrentOfficialSummary: (date: string | null) => void;
};

const initialData = {
  billData: null,
  isDyslexicFriendly: false,
  currentAiSummary: null,
  currentOfficialSummary: null,
};

export const useBillPageStore = create<BillPageStore>((set) => ({
  ...initialData,
  setBillData: (data: FullUserLegislationData | null) =>
    set({ billData: data }),
  setIsDyslexicFriendly: (data: boolean) => set({ isDyslexicFriendly: data }),
  setCurrentAiSummary: (date: string | null) => set({ currentAiSummary: date }),
  setCurrentOfficialSummary: (date: string | null) =>
    set({ currentOfficialSummary: date }),
}));
