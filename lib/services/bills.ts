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
  userId: string,
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
export const getRecentBills = async (userId: string, userRole: string) => {
  const bills = await prisma.legislation.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
  });

  await logUserAction(userId, "getRecentBills", null, userRole);
  return bills;
};
