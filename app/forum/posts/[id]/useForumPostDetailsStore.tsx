import { create } from "zustand";

export type ForumPostDetailsStore = {
  postComments: any;
  setPostComments: (data: any) => void;
  isPostBookmarked: boolean;
  setIsPostBookmarked: (data: boolean) => void;
  isMakingAPICall: boolean;
  setIsMakingAPICall: (isLoading: boolean) => void;
  isPostPinned: boolean;
  setIsPostPinned: (data: boolean) => void;
  isPostLocked: boolean;
  setIsPostLocked: (data: boolean) => void;
  isPostDeleted: boolean;
  setIsPostDeleted: (data: boolean) => void;
  userName: string | null;
  setUserName: (data: string) => void;
};

const initialPostData = {
  postComments: [],
  isPostDeleted: false,
  isPostBookmarked: false,
  isMakingAPICall: false,
  isPostPinned: false,
  isPostLocked: false,
  userName: "",
};

export const useForumPostDetailsStore = create<ForumPostDetailsStore>(
  (set) => ({
    ...initialPostData,
    setUserName: (data: string) => set({ userName: data }),
    setIsPostDeleted: (data: boolean) => set({ isPostDeleted: data }),
    setIsPostLocked: (data: boolean) => set({ isPostLocked: data }),
    setIsPostPinned: (data: boolean) => set({ isPostPinned: data }),
    setIsPostBookmarked: (data: boolean) => set({ isPostBookmarked: data }),
    setPostComments: (data: any) => set({ postComments: data }),
    setIsMakingAPICall: (isLoading: boolean) =>
      set({ isMakingAPICall: isLoading }),
  })
);
