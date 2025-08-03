import { create } from "zustand";

export type NewForumPostStore = {
  title: string;
  setTitle: (data: string) => void;
  body: string;
  setBody: (data: string) => void;
  type: string;
  setType: (data: string) => void;
  submitting: boolean;
  setSubmitting: (data: boolean) => void;
  resetStore: () => void;
};

const initialFormState = {
  title: "",
  body: "",
  type: "Bill Suggestion",
  submitting: false,
};

export const useNewForumPostStore = create<NewForumPostStore>((set) => ({
  ...initialFormState,
  resetStore: () => set({ ...initialFormState }),
  setSubmitting: (data: boolean) => set({ submitting: data }),
  setTitle: (data: string) => set({ title: data }),
  setBody: (data: string) => set({ body: data }),
  setType: (data: string) => set({ type: data }),
}));
