import { create } from "zustand";

export type NewForumPostStore = {
  title: string;
  setTitle: (data: string) => void;
  body: string;
  setBody: (data: string) => void;
  type: string;
  setType: (data: string) => void;
};

const initialFormState = {
  title: "",
  body: "",
  type: "Bill Suggestion",
};

export const useNewForumPostStore = create<NewForumPostStore>((set) => ({
  ...initialFormState,
  setTitle: (data: string) => set({ title: data }),
  setBody: (data: string) => set({ body: data }),
  setType: (data: string) => set({ type: data }),
}));
