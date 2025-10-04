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
// Updated createPost function
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

  // Check if user has posted within the last 3 hours
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const recentPost = await prisma.forumPost.findFirst({
    where: {
      authorId: data.authorId,
      createdAt: {
        gte: threeHoursAgo,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (recentPost) {
    const timeSinceLastPost = Date.now() - recentPost.createdAt.getTime();
    const hoursRemaining = Math.ceil(
      (3 * 60 * 60 * 1000 - timeSinceLastPost) / (60 * 60 * 1000)
    );
    throw new Error(
      `You can only post once every 3 hours. Please wait ${hoursRemaining} hour(s) before posting again.`
    );
  }

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

// Updated getCommentsForPost to use upvote sorting (for non-create scenarios)
export const getCommentsForPost = async (
  postId: number,
  userId: string | null
) => {
  return await getCommentsForPostWithUserPriority(postId, userId);
};

// Updated createComment to return sorted comments with user's comment at position #2
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

  // Create the comment
  const comment = await prisma.forumComment.create({
    data: {
      ...data,
      depth,
    },
  });

  await logUserAction(userId, "createComment", String(comment.id), userRole);

  // Get comments with smart sorting prioritizing the new comment at position #2
  const comments = await getCommentsForPostWithUserPriority(
    data.postId,
    userId,
    comment.id
  );

  return comments;
};

// Smart sorting: Upvotes first, user's new comment at #2 position
export const getCommentsForPostWithUserPriority = async (
  postId: number,
  userId: string | null,
  newCommentId?: number
) => {
  // Get all comments with upvote counts
  const comments = await prisma.forumComment.findMany({
    where: {
      postId: Number(postId),
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
  });

  // Function to sort by upvotes with user comment at position #2
  const smartSort = (commentList) => {
    if (!commentList || commentList.length === 0) return commentList;

    // First, sort by upvotes (descending), then by creation date
    const sorted = [...commentList].sort((a, b) => {
      const aNetVotes = a._count.upvotes - a._count.downvotes;
      const bNetVotes = b._count.upvotes - b._count.downvotes;

      if (aNetVotes !== bNetVotes) {
        return bNetVotes - aNetVotes; // Higher net votes first
      }

      // If net votes are equal, sort by total upvotes
      if (a._count.upvotes !== b._count.upvotes) {
        return b._count.upvotes - a._count.upvotes;
      }

      // Finally, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // If there's a new comment and it's not already at position 0, move it to position 1 (#2)
    if (newCommentId && sorted.length > 1) {
      const newCommentIndex = sorted.findIndex((c) => c.id === newCommentId);

      if (newCommentIndex > 1) {
        // Remove the new comment from its current position
        const newComment = sorted.splice(newCommentIndex, 1)[0];
        // Insert it at position 1 (second place, keeping top upvoted at #1)
        sorted.splice(1, 0, newComment);
      }
      // If newCommentIndex is 0, it's already the top comment by upvotes, leave it there
      // If newCommentIndex is 1, it's already at position #2, leave it there
    }

    return sorted;
  };

  // Sort root comments with smart sorting
  const sortedComments = smartSort(comments);

  // Apply smart sorting to replies at each level
  sortedComments.forEach((comment) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies = smartSort(comment.replies);
    }
  });

  return sortedComments;
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
// Also update getPostById to use the new sorting
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

  // Get comments using the new smart sorting
  const comments = await getCommentsForPostWithUserPriority(
    Number(postId),
    userId
  );

  // Transform the data to include userVoteStatus and comments
  const postWithVoteStatus = response
    ? {
        ...response,
        comments, // Use the smartly sorted comments
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

// Soft delete a comment (user deletes their own comment)
export const softDeleteComment = async (
  commentId: number,
  userId: string,
  userRole: string
) => {
  // First verify the user owns this comment
  const comment = await prisma.forumComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, isDeleted: true },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.authorId !== userId) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  if (comment.isDeleted) {
    throw new Error("Comment is already deleted");
  }

  // Soft delete the comment - preserve structure but remove content and PII
  const deletedComment = await prisma.forumComment.update({
    where: { id: commentId },
    data: {
      body: "[deleted]", // Replace content with [deleted]
      isDeleted: true, // Mark as deleted
      isEdited: false, // Reset edited flag since content is gone
      updatedAt: new Date(),
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
      post: true,
      parent: true,
      replies: true,
      upvotes: true,
      downvotes: true,
      _count: {
        select: {
          upvotes: true,
          downvotes: true,
        },
      },
    },
  });

  await logUserAction(userId, "softDeleteComment", String(commentId), userRole);
  return deletedComment;
};
export const softDeletePost = async (
  postId: number,
  userId: string,
  userRole: string
) => {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { authorId: true, isDeleted: true },
  });
  const adminRoles = ["Super Admin", "Admin"];
  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId !== userId && !adminRoles.includes(userRole)) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  if (post.isDeleted) {
    throw new Error("Post is already deleted");
  }

  // Soft delete - keep author but mark as deleted and clear content
  const deletedPost = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      title: "[deleted]",
      body: "[deleted]",
      isDeleted: true, // Mark as deleted
      isEdited: false,
      updatedAt: new Date(),
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
      upvotes: true,
      downvotes: true,
      bookmarks: true,
    },
  });

  await logUserAction(userId, "softDeletePost", String(postId), userRole);
  return deletedPost;
};
