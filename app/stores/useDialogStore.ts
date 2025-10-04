import { create } from "zustand";

type DialogStore = {
  isUsernameSelectDialogOpen: boolean;
  setIsUsernameSelectDialogOpen: (data: boolean) => void;
};

const initialDialogStoreState = {
  isUsernameSelectDialogOpen: false,
};

export const useDialogStore = create<DialogStore>((set) => ({
  ...initialDialogStoreState,
  setIsUsernameSelectDialogOpen: (data: boolean) =>
    set({ isUsernameSelectDialogOpen: data }),
}));
