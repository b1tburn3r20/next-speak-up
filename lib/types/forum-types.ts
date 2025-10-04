import { UserSessionRole } from "./user-types";

export type ForumPostAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: UserSessionRole;
};

export type UserVoteStatus = {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
};

export type FullLandingForumCounts = {
  comments: number;
  upvotes: number;
  downvotes: number;
};

// New type for comment vote counts
export type ForumCommentCounts = {
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
  views: number;
  userVoteStatus: UserVoteStatus | null;
  updatedAt: Date;
  _count: FullLandingForumCounts;
};

// Updated ForumComment type with vote information
export type ForumComment = {
  id: number;
  body: string;
  authorId: string;
  postId: number;
  parentId: number | null;
  depth: number;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: ForumPostAuthor;
  upvotes: any[];
  downvotes: any[];
  _count: ForumCommentCounts;
  userVoteStatus?: UserVoteStatus | null;
  replies?: ForumComment[];
};

export type ForumTag = {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ForumPostTag = {
  postId: number;
  tagId: number;
  tag: ForumTag;
};

export type FullForumPost = {
  id: number;
  type: string;
  title: string;
  body: string;
  authorId: string;
  isLocked: boolean;
  isPinned: boolean;
  isEdited: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  author: ForumPostAuthor;
  tags: ForumPostTag[];
  comments: ForumComment[];
  upvotes: any[];
  downvotes: any[];
  bookmarks: any[];
  _count: FullLandingForumCounts;
  userVoteStatus: UserVoteStatus | null;
};
