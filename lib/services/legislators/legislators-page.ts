import prisma from "@/prisma/client";
import { logUserAction } from "../user";
import { getVerifiedSession } from "../bills";

export const getCongressLegislators = async () => {

  const { userId, userRole } = await getVerifiedSession();


  const data = await prisma.congressMember.findMany({
    where: {
      active: true,
    },
    select: {
      bioguideId: true,
      name: true,
      state: true,
      district: true,
      role: true,
    },
  });

  await logUserAction(userId, "Get All Legislators", null, userRole);
  return data;
};
