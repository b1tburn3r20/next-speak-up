import prisma from "@/prisma/client";
import { logUserAction } from "./user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "../types/user-types";
import { Permission } from "@prisma/client";

export const getVerifiedSession = async (): Promise<{
  userId: string | null;
  userRole: string;
  permissions: Permission[]
}> => {
  const session: AuthSession = await getServerSession(authOptions);
  return {
    userId: session?.user?.id ?? null,
    userRole: session?.user?.role?.name ?? "guest",
    permissions: session?.user?.permissions ?? [],
  };
};

export const checkHasPermission = (permission: string, permissions: Permission[]) =>
  permissions?.find((p) => p.name === permission)



export const roleHasPermission = async (
  roleId: number,
  permissionId: number
) => {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
  });
  return existing !== null;
};

export const getBillData = async (billId: string) => {
  const { userId, userRole } = await getVerifiedSession();

  const response = await prisma.legislation.findUnique({
    where: {
      name_id: billId,
    },
    include: {
      summaries: true,
      aiSummaries: true,

    },
  });

  let userVote = null;
  if (userId && response) {
    userVote = await prisma.userVote.findFirst({
      where: {
        userId,
        legislationId: response.id,
      },
      select: { votePosition: true, createdAt: true, updatedAt: true },
    });
  }

  await logUserAction(userId, "getBillData", billId, userRole);

  return {
    ...response,
  };
};

export const getNewBills = async () => {
  const { userId, userRole } = await getVerifiedSession();

  const bills = await prisma.legislation.findMany({
    take: 10,
    orderBy: {
      id: "asc",
    },
    include: {
      policyArea: true,
    },
  });

  await logUserAction(userId, "getNewBills", null, userRole);

  return bills;
};


export const getRecentBills = async () => {
  const { userId, userRole } = await getVerifiedSession();
  const latestActions = await prisma.billAction.groupBy({
    by: ["legislationId"],
    _max: { actionDate: true },
    orderBy: {
      _max: { actionDate: "desc" },
    },
    take: 10,
  });

  const billIds = latestActions.map((a) => a.legislationId);

  const bills = await prisma.legislation.findMany({
    where: { id: { in: billIds } },
    include: {
      summaries: true,
      aiSummaries: true,
    },
  });

  const sortedBills = billIds.map((id) => bills.find((b) => b.id === id)!);


  const billsWithVotes = sortedBills.map((bill) => ({
    ...bill,
  }));

  await logUserAction(userId, "getRecentBills", null, userRole);
  return billsWithVotes;
};

export const markBillAsViewed = async (billId: number) => {
  const { userId, userRole } = await getVerifiedSession();

  if (!userId) {
    await logUserAction(null, "markBillAsViewed", String(billId), userRole);
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
      viewedAt: new Date(),
    },
  });

  if (!existing?.hasViewed) {
    await logUserAction(userId, "markBillAsViewed", String(billId), userRole);
  }
};

export const getLastViewedBill = async () => {
  const { userId, userRole } = await getVerifiedSession();

  if (!userId) {
    await logUserAction(null, "getLastViewedBill", null, userRole);
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
          summaries: true,
          aiSummaries: true,

        },
      },
    },
  });

  if (!lastViewed?.legislation) {
    await logUserAction(userId, "getLastViewedBill", null, userRole);
    return null;
  }


  await logUserAction(userId, "getLastViewedBill", null, userRole);

  return {
    ...lastViewed.legislation,
  };
};


