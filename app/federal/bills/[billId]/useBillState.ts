import { create } from "zustand";

type BillState = {
  billText: string;
  isBillLoading: boolean;
  isBillLoaded: boolean;
  currentBillId: string;

  setCurrentBillId: (data: string) => void;
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
  currentBillId: "",
};

export const useBillState = create<BillState>((set, get) => ({
  ...initialState,
  setCurrentBillId: (data: string) => set({ currentBillId: data }),
  clearBill: () => set({ ...initialState }),
  setBillText: (text) => set({ billText: text }),
  setBillLoading: (loading) => set({ isBillLoading: loading }),
  setBillLoaded: (loaded) => set({ isBillLoaded: loaded }),
  getBillText: () => get().billText, // Add this function
}));
