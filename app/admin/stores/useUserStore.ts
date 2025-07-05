import { create } from "zustand";

export type UserStore = {
  activeUserRole: string | null;
  setActiveUserRole: (data: string) => void;
};

const initialState = {
  activeUserRole: null,
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,
  setActiveUserRole: (data: string) => set({ activeUserRole: data }),
}));
