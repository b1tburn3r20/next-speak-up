import prisma from "@/prisma/client";
import { getVerifiedSession } from "./bills";

export const getDashboardMetrics = async () => {
  const { userId } = await getVerifiedSession();

  const favoriteActions = await prisma.userAction.groupBy({
    by: ["action"],
    where: { userId },
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
    take: 10,
  });

  const formattedActions = favoriteActions.map((item) => ({
    action: item.action,
    count: item._count.action,
  }));

  return { favoriteActions: formattedActions };
};

export const getCombinedDashboardMetrics = async () => {
  const { userId } = await getVerifiedSession();

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

  const results = await Promise.all(queries);

  const actionCounts = new Map<string, number>();
  results.forEach((result) => {
    result.forEach((item) => {
      const currentCount = actionCounts.get(item.action) || 0;
      actionCounts.set(item.action, currentCount + item._count.action);
    });
  });

  const favoriteActions = Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { favoriteActions };
};

export async function getBookmarkedPosts() {
  const { userId } = await getVerifiedSession();

  if (!userId) {
    return [];
  }

  try {
    const bookmarkedPosts = await prisma.forumPost.findMany({
      where: {
        isDeleted: false,
        bookmarks: {
          some: { userId },
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
      take: 10,
    });

    return bookmarkedPosts.map((post) => ({ ...post, isBookmarked: true }));
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    return [];
  }
}
