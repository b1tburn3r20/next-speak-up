// app/lib/services/user.ts
import {
  User as PrismaUser,
  AgeRange,
  IncomeRange,
  Prisma,
} from "@prisma/client";
import prisma from "@/prisma/client";
import { headers } from "next/headers";

// Use Prisma's generated type and extend it if needed
export type User = PrismaUser;

export type UserUpdateData = {
  name?: string | null;
  username?: string | null;
  ageRange?: AgeRange | null;
  state?: string | null;
  householdIncome?: IncomeRange | null;
};

export const userService = {
  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  async updateUserProfile(userId: string, data: UserUpdateData) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  async updateUserDemographics(
    userId: string,
    demographics: {
      ageRange?: AgeRange | null;
      state?: string | null;
      householdIncome?: IncomeRange | null;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...demographics,
        updatedAt: new Date(),
      },
    });
  },

  async toggleOnboardingStatus(userId: string) {
    // First get the current user to check their onboarding status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { needsOnboarding: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Toggle the status
    return prisma.user.update({
      where: { id: userId },
      data: {
        needsOnboarding: !user.needsOnboarding,
        updatedAt: new Date(),
      },
    });
  },

  async deleteUser(userId: string) {
    // First delete related records
    await Promise.all([
      prisma.favoritedCongressMember.deleteMany({
        where: { userId },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
      prisma.account.deleteMany({
        where: { userId },
      }),
      prisma.authenticator.deleteMany({
        where: { userId },
      }),
    ]);

    // Then delete the user
    return prisma.user.delete({
      where: { id: userId },
    });
  },

  async getUserStats() {
    const [totalUsers, ageRangeBreakdown, stateBreakdown, incomeBreakdown] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ["ageRange"],
          _count: true,
          where: {
            ageRange: { not: null },
          },
        }),
        prisma.user.groupBy({
          by: ["state"],
          _count: true,
          where: {
            state: { not: null },
          },
        }),
        prisma.user.groupBy({
          by: ["householdIncome"],
          _count: true,
          where: {
            householdIncome: { not: null },
          },
        }),
      ]);

    return {
      totalUsers,
      ageRangeBreakdown,
      stateBreakdown,
      incomeBreakdown,
    };
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return !user;
  },

  async updateEmail(userId: string, newEmail: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: null, // Reset email verification when email is changed
        updatedAt: new Date(),
      },
    });
  },

  async updateEmailVerification(userId: string, verificationDate: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: verificationDate,
        updatedAt: new Date(),
      },
    });
  },
};
export const getAllUsers = async () => {
  return await prisma.user.findMany();
};
export const getUserById = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: String(userId) },
    include: {
      role: true,
    },
  });
};

async function logGuestAction(
  action: string,
  entityId?: string | null,
  sessionId?: string | null
) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";

    await prisma.guestAction.create({
      data: {
        sessionId: sessionId || null,
        ipAddress,
        userAgent,
        action,
        entityId: entityId || null,
      },
    });
  } catch (error) {
    console.error("Failed to log guest action:", error);
  }
}

export async function logUserAction(
  userId?: string | null,
  action?: string,
  entityId?: string | null,
  role?: string | null,
  sessionId?: string | null
) {
  const actionName = action || "unknown";

  if (!userId) {
    // Log guest action
    await logGuestAction(actionName, entityId, sessionId);
    return;
  }

  // Log authenticated user action
  try {
    await prisma.userAction.create({
      data: {
        userId,
        userRole: role || "User",
        action: actionName,
        entityId: entityId || null,
      },
    });
  } catch (error) {
    console.error("Failed to log user action:", error);
  }
}

export async function checkIfUsernameIsAvailable(username: string) {
  return prisma.user.findUnique({
    where: {
      username: username,
    },
  });
}
export async function updateUserUsername(
  userId: string,
  userRole: string,
  newUsername: string
) {
  try {
    // First check if username is available
    const existingUser = await checkIfUsernameIsAvailable(newUsername);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Username is already taken");
    }

    // Update the user's username
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        username: newUsername,
      },
    });

    // Log the action
    await logUserAction(userId, "updateUsername", null, userRole);

    return updatedUser;
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}
export const getSoftUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      image: true,
      createdAt: true,
      role: {
        select: {
          name: true,
          description: true,
        },
      },
      // Forum activity counts
      _count: {
        select: {
          forumPosts: true,
          forumComments: true,
          forumPostUpvotes: true,
          forumCommentUpvotes: true,
          forumPostBookmarks: true,
        },
      },
    },
  });
};

// Alternative version with more detailed metrics
export const getSoftUserByIdWithMetrics = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      image: true,
      createdAt: true,
      role: {
        select: {
          name: true,
          description: true,
        },
      },
      // Get actual forum posts to calculate additional metrics
      forumPosts: {
        select: {
          id: true,
          views: true,
          createdAt: true,
          _count: {
            select: {
              upvotes: true,
              downvotes: true,
              comments: true,
            },
          },
        },
        where: {
          isDeleted: false,
        },
      },
      forumComments: {
        select: {
          id: true,
          createdAt: true,
          _count: {
            select: {
              upvotes: true,
              downvotes: true,
            },
          },
        },
        where: {
          isDeleted: false,
        },
      },
      _count: {
        select: {
          forumPostUpvotes: true,
          forumCommentUpvotes: true,
          forumPostBookmarks: true,
          userVotes: true,
          favoritedMembers: true,
        },
      },
    },
  });

  if (!user) return null;

  // Calculate derived metrics
  const totalPostViews = user.forumPosts.reduce(
    (sum, post) => sum + post.views,
    0
  );
  const totalPostUpvotes = user.forumPosts.reduce(
    (sum, post) => sum + post._count.upvotes,
    0
  );
  const totalPostDownvotes = user.forumPosts.reduce(
    (sum, post) => sum + post._count.downvotes,
    0
  );
  const totalCommentsReceived = user.forumPosts.reduce(
    (sum, post) => sum + post._count.comments,
    0
  );

  const totalCommentUpvotes = user.forumComments.reduce(
    (sum, comment) => sum + comment._count.upvotes,
    0
  );
  const totalCommentDownvotes = user.forumComments.reduce(
    (sum, comment) => sum + comment._count.downvotes,
    0
  );

  // Calculate days since joining
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: user.id,
    username: user.username,
    image: user.image,
    createdAt: user.createdAt,
    daysSinceJoining,
    role: user.role,
    metrics: {
      // Content creation
      totalPosts: user.forumPosts.length,
      totalComments: user.forumComments.length,

      // Engagement received
      totalPostViews,
      totalPostUpvotes,
      totalPostDownvotes,
      totalCommentsReceived,
      totalCommentUpvotes,
      totalCommentDownvotes,

      // Engagement given
      upvotesGiven:
        user._count.forumPostUpvotes + user._count.forumCommentUpvotes,
      bookmarksMade: user._count.forumPostBookmarks,

      // Platform engagement
      billVotes: user._count.userVotes,
      favoritedMembers: user._count.favoritedMembers,

      // Calculated ratios (avoid division by zero)
      avgViewsPerPost:
        user.forumPosts.length > 0
          ? Math.round(totalPostViews / user.forumPosts.length)
          : 0,
      postUpvoteRatio:
        totalPostUpvotes + totalPostDownvotes > 0
          ? Math.round(
              (totalPostUpvotes / (totalPostUpvotes + totalPostDownvotes)) * 100
            )
          : 0,
    },
  };
};
