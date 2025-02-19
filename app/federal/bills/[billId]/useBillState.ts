import { create } from "zustand";

type BillState = {
  billText: string;
  isBillLoading: boolean;
  isBillLoaded: boolean;
  clearBill: () => void;
  setBillText: (text: string) => void;
  setBillLoading: (loading: boolean) => void;
  setBillLoaded: (loaded: boolean) => void;
  getBillText: () => string; // Add this type
};

const initialState = {
  billText: "",
  isBillLoading: false,
  isBillLoaded: false,
};

export const useBillState = create<BillState>((set, get) => ({
  ...initialState,
  clearBill: () => set({ ...initialState }),
  setBillText: (text) => set({ billText: text }),
  setBillLoading: (loading) => set({ isBillLoading: loading }),
  setBillLoaded: (loaded) => set({ isBillLoaded: loaded }),
  getBillText: () => get().billText, // Add this function
}));
