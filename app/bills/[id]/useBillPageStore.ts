import { create } from "zustand";
import { Legislation } from "@prisma/client";

export type BillPageStore = {
  billData: Legislation | null;
  isDyslexicFriendly: boolean;
  //
  setBillData: (data: Legislation) => void;
  setIsDyslexicFriendly: (data: boolean) => void;
};

const initialData = {
  billData: null,
  isDyslexicFriendly: false,
};

export const useBillPageStore = create<BillPageStore>((set) => ({
  ...initialData,
  setBillData: (data: Legislation | null) => set({ billData: data }),
  setIsDyslexicFriendly: (data: boolean) => set({ isDyslexicFriendly: data }),
}));
