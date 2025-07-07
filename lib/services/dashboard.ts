import prisma from "@/prisma/client";

export const getDashboardMetrics = async (
  userId?: string,
  sessionId?: string,
  ipAddress?: string
) => {
  let favoriteActions;

  if (userId) {
    // For authenticated users - get their most frequent actions
    favoriteActions = await prisma.userAction.groupBy({
      by: ["action"],
      where: {
        userId: userId,
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10, // Get top 10 most frequent actions
    });
  } else if (sessionId) {
    // For guests with session ID - get their most frequent actions
    favoriteActions = await prisma.guestAction.groupBy({
      by: ["action"],
      where: {
        sessionId: sessionId,
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10, // Get top 10 most frequent actions
    });
  } else if (ipAddress && ipAddress !== "unknown") {
    // For guests with IP address - get their most frequent actions
    favoriteActions = await prisma.guestAction.groupBy({
      by: ["action"],
      where: {
        ipAddress: ipAddress,
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10, // Get top 10 most frequent actions
    });
  } else {
    // No user, session, or valid IP - return empty array
    favoriteActions = [];
  }

  // Transform the data to a more readable format
  const formattedActions = favoriteActions.map((item) => ({
    action: item.action,
    count: item._count.action,
  }));

  return {
    favoriteActions: formattedActions,
  };
};

// Alternative version that combines both user and guest actions if you want overall stats
export const getCombinedDashboardMetrics = async (
  userId?: string,
  sessionId?: string
) => {
  const queries = [];

  if (userId) {
    queries.push(
      prisma.userAction.groupBy({
        by: ["action"],
        where: { userId },
        _count: { action: true },
      })
    );
  }

  if (sessionId) {
    queries.push(
      prisma.guestAction.groupBy({
        by: ["action"],
        where: { sessionId },
        _count: { action: true },
      })
    );
  }

  const results = await Promise.all(queries);

  // Combine and aggregate the results
  const actionCounts = new Map<string, number>();

  results.forEach((result) => {
    result.forEach((item) => {
      const currentCount = actionCounts.get(item.action) || 0;
      actionCounts.set(item.action, currentCount + item._count.action);
    });
  });

  // Convert to array and sort by count
  const favoriteActions = Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return {
    favoriteActions,
  };
};

export async function getBookmarkedPosts(userId: string | undefined) {
  if (!userId) {
    return [];
  }

  try {
    const bookmarkedPosts = await prisma.forumPost.findMany({
      where: {
        isDeleted: false,
        bookmarks: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            upvotes: true,
            downvotes: true,
            bookmarks: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 10, // Limit to 10 most recent bookmarked posts
    });

    // Add isBookmarked flag (will always be true for these results)
    const postsWithBookmarkFlag = bookmarkedPosts.map((post) => ({
      ...post,
      isBookmarked: true,
    }));

    return postsWithBookmarkFlag;
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    return [];
  }
}
