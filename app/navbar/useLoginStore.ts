import { create } from "zustand";

export type LoginStore = {
  isLoginDialogOpen: boolean;
  setIsLoginDialogOpen: (data: boolean) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
  isLoginDialogOpen: false,
  setIsLoginDialogOpen: (data: boolean) => set({ isLoginDialogOpen: data }),
}));
