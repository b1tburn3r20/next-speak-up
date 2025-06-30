import { create } from "zustand";

export type ForumPostDetailsStore = {
  postComments: any;
  setPostComments: (data: any) => void;
  isPostBookmarked: boolean;
  setIsPostBookmarked: (data: boolean) => void;
};

const initialPostData = {
  postComments: [],
  isPostBookmarked: false,
};

export const useForumPostDetailsStore = create<ForumPostDetailsStore>(
  (set) => ({
    ...initialPostData,
    setIsPostBookmarked: (data: boolean) => set({ isPostBookmarked: data }),
    setPostComments: (data: any) => set({ postComments: data }),
  })
);
