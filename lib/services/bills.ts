import prisma from "@/prisma/client";
import { logUserAction } from "./user";

export const roleHasPermission = async (
  roleId: number,
  permissionId: number
) => {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: roleId,
        permissionId: permissionId,
      },
    },
  });
  return existing !== null;
};

export const getBillData = async (
  billId: number,
  userId: string | null,
  userRole: string
) => {
  const response = await prisma.legislation.findUnique({
    where: {
      id: billId,
    },
  });

  await logUserAction(userId, "getBillData", String(billId), userRole);
  return response;
};

export const getRecentBills = async (
  userId: string | null,
  userRole: string
) => {
  const bills = await prisma.legislation.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
    include: {
      userTracks: userId
        ? {
            where: { userId },
            select: { hasViewed: true, viewedAt: true },
          }
        : false, // Don't include userTracks for guests
    },
  });

  await logUserAction(userId, "getRecentBills", null, userRole);
  return bills;
};

export const markBillAsViewed = async (
  billId: number,
  userId: string | null,
  userRole: string
) => {
  // Only track bill views for authenticated users
  if (!userId) {
    await logUserAction(userId, "markBillAsViewed", String(billId), userRole);
    return;
  }

  const existing = await prisma.userBillTrack.findUnique({
    where: {
      userId_legislationId: {
        userId,
        legislationId: billId,
      },
    },
  });

  // Always update the viewedAt timestamp
  await prisma.userBillTrack.upsert({
    where: {
      userId_legislationId: {
        userId,
        legislationId: billId,
      },
    },
    create: {
      userId,
      legislationId: billId,
      hasViewed: true,
      viewedAt: new Date(),
    },
    update: {
      hasViewed: true,
      viewedAt: new Date(), // Always update the timestamp
    },
  });

  // Only log the action if this is the first time viewing
  if (!existing?.hasViewed) {
    await logUserAction(userId, "markBillAsViewed", String(billId), userRole);
  }
};

export const getLastViewedBill = async (
  userId: string | null,
  userRole: string
) => {
  // Return null for guests since they don't have tracked views
  if (!userId) {
    await logUserAction(userId, "getLastViewedBill", null, userRole);
    return null;
  }

  const lastViewed = await prisma.userBillTrack.findFirst({
    where: {
      userId,
      hasViewed: true,
    },
    orderBy: {
      viewedAt: "desc",
    },
    include: {
      legislation: {
        include: {
          userTracks: {
            where: { userId },
            select: { hasViewed: true, viewedAt: true },
          },
        },
      },
    },
  });

  await logUserAction(userId, "getLastViewedBill", null, userRole);

  // Return the legislation data or null if no bills have been viewed
  return lastViewed?.legislation || null;
};
