import prisma from "@/prisma/client";
import { logUserAction } from "../user";

export const getCongressLegislators = async (userId, userRole) => {
  const data = prisma.congressMember.findMany({
    where: {
      active: true,
    },
    include: {
      depiction: true,
    },
  });

  await logUserAction(userId, "Get All Legislators", null, userRole);
  return data;
};
