import { create } from "zustand";

export type NavbarStore = {
  navCollapsed: boolean;
  setNavCollapsed: (data: boolean) => void;
};

export const useNavbarStore = create<NavbarStore>((set, get) => ({
  navCollapsed: false,
  setNavCollapsed: (data: boolean) => set({ navCollapsed: data }),
}));
