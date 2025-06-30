import prisma from "@/prisma/client";
import { logUserAction } from "./user";

// Get all posts with minimal data for listing
export const getAllPosts = async (userId: string | null, userRole: string) => {
  const posts = await prisma.forumPost.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      views: true,
      isPinned: true,
      isLocked: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true, // Added profile image
        },
      },
      _count: {
        select: {
          comments: true,
          upvotes: true,
          downvotes: true,
        },
      },
      // Only get the user's specific votes if userId exists
      ...(userId && {
        upvotes: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
        downvotes: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      }),
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
  // Transform the data to include userVoteStatus
  const postsWithVoteStatus = posts.map((post) => ({
    ...post,
    userVoteStatus: userId
      ? {
          hasUpvoted: post.upvotes?.length > 0,
          hasDownvoted: post.downvotes?.length > 0,
        }
      : null,
  }));

  await logUserAction(userId, "getAllPosts", null, userRole);
  return postsWithVoteStatus;
};

// Increment post views
export const incrementPostViews = async (
  postId: number,
  userId: string | null,
  userRole: string
) => {
  await prisma.forumPost.update({
    where: { id: postId },
    data: {
      views: {
        increment: 1,
      },
    },
  });

  await logUserAction(userId, "incrementPostViews", String(postId), userRole);
};

// Create a new post
export const createPost = async (
  data: {
    title: string;
    body: string;
    type: string;
    authorId: string;
    tagIds?: number[];
  },
  userId: string | null,
  userRole: string
) => {
  const { tagIds, ...postData } = data;

  const post = await prisma.forumPost.create({
    data: {
      ...postData,
      tags: tagIds
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: true,
      upvotes: true,
      downvotes: true,
      bookmarks: true,
    },
  });

  await logUserAction(userId, "createPost", String(post.id), userRole);
  return post;
};

// Create a new comment
export const createComment = async (
  data: {
    body: string;
    authorId: string;
    postId: number;
    parentId?: number;
  },
  userId: string | null,
  userRole: string
) => {
  // Calculate depth if this is a reply
  let depth = 0;
  if (data.parentId) {
    const parentComment = await prisma.forumComment.findUnique({
      where: { id: data.parentId },
      select: { depth: true },
    });
    depth = (parentComment?.depth || 0) + 1;
  }

  const comment = await prisma.forumComment.create({
    data: {
      ...data,
      depth,
    },
    include: {
      author: true,
      post: true,
      parent: true,
      replies: true,
      upvotes: true,
      downvotes: true,
    },
  });

  await logUserAction(userId, "createComment", String(comment.id), userRole);
  return comment;
};

// Bookmark a post

export const bookmarkPost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  const bookmark = await prisma.forumPostBookmark.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    create: {
      userId,
      postId,
    },
    update: {},
    include: {
      post: true,
      user: true,
    },
  });

  await logUserAction(userId, "bookmarkPost", String(postId), userRole);
  return bookmark;
};

// Remove bookmark from a post
export const unbookmarkPost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  await prisma.forumPostBookmark.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  await logUserAction(userId, "unbookmarkPost", String(postId), userRole);
};

// Update post title or body
export const updatePost = async (
  postId: number,
  data: {
    title?: string;
    body?: string;
  },
  userId: string,
  userRole: string
) => {
  const post = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      ...data,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: true,
      upvotes: true,
      downvotes: true,
      bookmarks: true,
    },
  });

  await logUserAction(userId, "updatePost", String(postId), userRole);
  return post;
};

// Update comment body
export const updateComment = async (
  commentId: number,
  body: string,
  userId: string,
  userRole: string
) => {
  const comment = await prisma.forumComment.update({
    where: { id: commentId },
    data: {
      body,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      author: true,
      post: true,
      parent: true,
      replies: true,
      upvotes: true,
      downvotes: true,
    },
  });

  await logUserAction(userId, "updateComment", String(commentId), userRole);
  return comment;
};

// Upvote a post
export const upvotePost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  // Remove any existing downvote first
  await prisma.forumPostDownvote.deleteMany({
    where: { userId, postId },
  });

  const upvote = await prisma.forumPostUpvote.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    create: {
      userId,
      postId,
    },
    update: {}, // If already exists, do nothing
    include: {
      post: true,
      user: true,
    },
  });

  await logUserAction(userId, "upvotePost", String(postId), userRole);
  return upvote;
};

// Remove upvote from a post
export const removeUpvotePost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  await prisma.forumPostUpvote.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  await logUserAction(userId, "removeUpvotePost", String(postId), userRole);
};

// Downvote a post
export const downvotePost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  // Remove any existing upvote first
  await prisma.forumPostUpvote.deleteMany({
    where: { userId, postId },
  });

  const downvote = await prisma.forumPostDownvote.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    create: {
      userId,
      postId,
    },
    update: {}, // If already exists, do nothing
    include: {
      post: true,
      user: true,
    },
  });

  await logUserAction(userId, "downvotePost", String(postId), userRole);
  return downvote;
};

// Remove downvote from a post
export const removeDownvotePost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  await prisma.forumPostDownvote.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  await logUserAction(userId, "removeDownvotePost", String(postId), userRole);
};

// Upvote a comment
export const upvoteComment = async (
  commentId: number,
  userId: string,
  userRole: string
) => {
  // Remove any existing downvote first
  await prisma.forumCommentDownvote.deleteMany({
    where: { userId, commentId },
  });

  const upvote = await prisma.forumCommentUpvote.upsert({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
    create: {
      userId,
      commentId,
    },
    update: {}, // If already exists, do nothing
    include: {
      comment: true,
      user: true,
    },
  });

  await logUserAction(userId, "upvoteComment", String(commentId), userRole);
  return upvote;
};

// Remove upvote from a comment
export const removeUpvoteComment = async (
  commentId: number,
  userId: string,
  userRole: string
) => {
  await prisma.forumCommentUpvote.delete({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  await logUserAction(
    userId,
    "removeUpvoteComment",
    String(commentId),
    userRole
  );
};

// Downvote a comment
export const downvoteComment = async (
  commentId: number,
  userId: string,
  userRole: string
) => {
  // Remove any existing upvote first
  await prisma.forumCommentUpvote.deleteMany({
    where: { userId, commentId },
  });

  const downvote = await prisma.forumCommentDownvote.upsert({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
    create: {
      userId,
      commentId,
    },
    update: {}, // If already exists, do nothing
    include: {
      comment: true,
      user: true,
    },
  });

  await logUserAction(userId, "downvoteComment", String(commentId), userRole);
  return downvote;
};

// Remove downvote from a comment
export const removeDownvoteComment = async (
  commentId: number,
  userId: string,
  userRole: string
) => {
  await prisma.forumCommentDownvote.delete({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  await logUserAction(
    userId,
    "removeDownvoteComment",
    String(commentId),
    userRole
  );
};

// Lock a post (admin function)
export const lockPost = async (
  postId: number,
  isLocked: boolean,
  userId: string,
  userRole: string
) => {
  const post = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      isLocked,
      updatedAt: new Date(),
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: true,
      upvotes: true,
      downvotes: true,
      bookmarks: true,
    },
  });

  await logUserAction(
    userId,
    isLocked ? "lockPost" : "unlockPost",
    String(postId),
    userRole
  );
  return post;
};

// Pin a post (admin function)
export const pinPost = async (
  postId: number,
  isPinned: boolean,
  userId: string,
  userRole: string
) => {
  const post = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      isPinned,
      updatedAt: new Date(),
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: true,
      upvotes: true,
      downvotes: true,
      bookmarks: true,
    },
  });

  await logUserAction(
    userId,
    isPinned ? "pinPost" : "unpinPost",
    String(postId),
    userRole
  );
  return post;
};
export const getPostById = async (userId, userRole, postId) => {
  const response = await prisma.forumPost.findUnique({
    where: {
      id: Number(postId),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          comments: true,
          upvotes: true,
          downvotes: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              role: true,
            },
          },
          // Add these for comment voting
          upvotes: userId
            ? {
                where: { userId },
                select: { id: true },
                take: 1,
              }
            : true,
          downvotes: userId
            ? {
                where: { userId },
                select: { id: true },
                take: 1,
              }
            : true,
          _count: {
            select: {
              upvotes: true,
              downvotes: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  role: true,
                },
              },
              // Don't forget to add voting info for replies too if needed
              upvotes: userId
                ? {
                    where: { userId },
                    select: { id: true },
                    take: 1,
                  }
                : true,
              downvotes: userId
                ? {
                    where: { userId },
                    select: { id: true },
                    take: 1,
                  }
                : true,
              _count: {
                select: {
                  upvotes: true,
                  downvotes: true,
                },
              },
            },
          },
        },
      },
      upvotes: userId
        ? {
            where: { userId },
            select: { id: true },
            take: 1,
          }
        : true,
      downvotes: userId
        ? {
            where: { userId },
            select: { id: true },
            take: 1,
          }
        : true,
      bookmarks: true,
    },
  });

  // Transform the data to include userVoteStatus
  const postWithVoteStatus = response
    ? {
        ...response,
        userVoteStatus: userId
          ? {
              hasUpvoted: response.upvotes?.length > 0,
              hasDownvoted: response.downvotes?.length > 0,
            }
          : null,
      }
    : null;

  await logUserAction(userId, "getPostById", postId, userRole);
  return postWithVoteStatus;
};
