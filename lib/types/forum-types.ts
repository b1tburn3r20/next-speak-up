export type ForumPostAuthor = {
  id: string;
  name: string;
  username: string;
};

export type FullLandingForumCounts = {
  comments: number;
  upvotes: number;
  downvotes: number;
};

export type FullLandingForumPost = {
  author: ForumPostAuthor;
  createdAt: Date;
  id: number;
  isLocked: boolean;
  isPinned: boolean;
  title: string;
  type: string;
  updatedAt: Date;
  _count: FullLandingForumCounts;
};
