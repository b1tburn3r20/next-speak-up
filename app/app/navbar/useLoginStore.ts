import { create } from "zustand";

export type LoginStore = {
  isLoginDialogOpen: boolean;
  isStateDistrictDialogOpen: boolean;
  setIsStateDistrictDialogOpen: (data: boolean) => void;
  setIsLoginDialogOpen: (data: boolean) => void;
};

const initialData = {
  isLoginDialogOpen: false,
  isStateDistrictDialogOpen: false,
};

export const useLoginStore = create<LoginStore>((set) => ({
  ...initialData,
  setIsStateDistrictDialogOpen: (data: boolean) =>
    set({ isStateDistrictDialogOpen: data }),

  setIsLoginDialogOpen: (data: boolean) => set({ isLoginDialogOpen: data }),
}));
