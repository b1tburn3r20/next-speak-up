import { create } from "zustand";
import { Legislation } from "@prisma/client";
import { FullUserLegislationData } from "@/lib/types/bill-types";

export type BillPageStore = {
  billData: FullUserLegislationData | null;
  isDyslexicFriendly: boolean;
  //
  setBillData: (data: FullUserLegislationData) => void;
  setIsDyslexicFriendly: (data: boolean) => void;
};

const initialData = {
  billData: null,
  isDyslexicFriendly: false,
};

export const useBillPageStore = create<BillPageStore>((set) => ({
  ...initialData,
  setBillData: (data: FullUserLegislationData | null) =>
    set({ billData: data }),
  setIsDyslexicFriendly: (data: boolean) => set({ isDyslexicFriendly: data }),
}));
