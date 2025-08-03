import { create } from "zustand";

export type UserStore = {
  activeUserRole: string | null;
  setActiveUserRole: (data: string) => void;
  userDistrict: number | null;
  userState: string | null;
  setUserDistrict: (data: number) => void;
  setUserState: (data: string) => void;
};

const initialState = {
  activeUserRole: null,
  userDistrict: null,
  userState: "",
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,
  setUserDistrict: (data: number) => set({ userDistrict: data }),
  setUserState: (data: string) => set({ userState: data }),
  setActiveUserRole: (data: string) => set({ activeUserRole: data }),
}));
