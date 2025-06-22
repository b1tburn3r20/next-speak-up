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
