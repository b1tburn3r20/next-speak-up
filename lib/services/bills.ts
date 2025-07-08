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
  billId: string, // This is the name_id we're searching by
  userId: string | null,
  userRole: string
) => {
  const response = await prisma.legislation.findUnique({
    where: {
      name_id: billId,
    },
    include: {
      summaries: true, // Include all summaries
      aiSummaries: true, // Include all AI summaries
      userTracks: userId
        ? {
            where: { userId },
            select: {
              hasViewed: true,
              viewedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          }
        : false,
    },
  });

  // Separately fetch user vote if user exists
  let userVote = null;
  if (userId && response) {
    userVote = await prisma.userVote.findFirst({
      where: {
        userId,
        legislationId: response.id, // Use the numeric id from the legislation we just found
      },
      select: { votePosition: true, createdAt: true, updatedAt: true },
    });
  }

  await logUserAction(userId, "getBillData", billId, userRole);

  return {
    ...response,
    userVotes: userVote ? [userVote] : [],
  };
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
      summaries: true, // Include all summaries
      aiSummaries: true, // Include all AI summaries
      userTracks: userId
        ? {
            where: { userId },
            select: {
              hasViewed: true,
              viewedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          }
        : false, // Don't include userTracks for guests
    },
  });

  // If user exists, fetch their votes for all these bills
  let userVotes: { [key: number]: any } = {};
  if (userId) {
    const billIds = bills.map((bill) => bill.id);
    const votes = await prisma.userVote.findMany({
      where: {
        userId,
        legislationId: { in: billIds },
      },
      select: {
        legislationId: true,
        votePosition: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create a lookup object for votes by legislation ID
    userVotes = votes.reduce((acc, vote) => {
      if (vote.legislationId) {
        acc[vote.legislationId] = {
          votePosition: vote.votePosition,
          createdAt: vote.createdAt,
          updatedAt: vote.updatedAt,
        };
      }
      return acc;
    }, {} as { [key: number]: any });
  }

  // Add user votes to each bill
  const billsWithVotes = bills.map((bill) => ({
    ...bill,
    userVotes: userVotes[bill.id] ? [userVotes[bill.id]] : [],
  }));

  await logUserAction(userId, "getRecentBills", null, userRole);
  return billsWithVotes;
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
          summaries: true, // Include all summaries
          aiSummaries: true, // Include all AI summaries
          userTracks: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!lastViewed?.legislation) {
    await logUserAction(userId, "getLastViewedBill", null, userRole);
    return null;
  }

  // Fetch user vote for this legislation
  const userVote = await prisma.userVote.findFirst({
    where: {
      userId,
      legislationId: lastViewed.legislation.id,
    },
    select: { votePosition: true, createdAt: true, updatedAt: true },
  });

  await logUserAction(userId, "getLastViewedBill", null, userRole);

  // Return the legislation data with user vote
  return {
    ...lastViewed.legislation,
    userVotes: userVote ? [userVote] : [],
  };
};

export const getTrackedBills = async (
  userId: string | null,
  userRole: string
) => {
  if (!userId) {
    return [];
  }

  const bills = await prisma.legislation.findMany({
    where: {
      userTracks: {
        some: {
          userId,
          tracking: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 15,
    include: {
      summaries: true, // Include all summaries
      aiSummaries: true, // Include all AI summaries
      userTracks: {
        where: { userId },
      },
    },
  });

  return bills;
};
