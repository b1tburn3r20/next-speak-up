import { create } from "zustand";

export type ForumPostDetailsStore = {
  postComments: any;
  setPostComments: (data: any) => void;
  isPostBookmarked: boolean;
  setIsPostBookmarked: (data: boolean) => void;
  isMakingAPICall: boolean;
  setIsMakingAPICall: (isLoading: boolean) => void;
};

const initialPostData = {
  postComments: [],
  isPostBookmarked: false,
  isMakingAPICall: false,
};

export const useForumPostDetailsStore = create<ForumPostDetailsStore>(
  (set) => ({
    ...initialPostData,
    setIsPostBookmarked: (data: boolean) => set({ isPostBookmarked: data }),
    setPostComments: (data: any) => set({ postComments: data }),
    setIsMakingAPICall: (isLoading: boolean) =>
      set({ isMakingAPICall: isLoading }),
  })
);
