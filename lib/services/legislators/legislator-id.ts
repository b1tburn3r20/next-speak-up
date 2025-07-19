import prisma from "@/prisma/client";
import { logUserAction } from "../user";

export const getComprehensiveLegislatorInformation = async (
  bioguideId,
  userId,
  userRole
) => {
  const data = await prisma.congressMember.findUnique({
    where: {
      bioguideId: bioguideId,
    },
    include: {
      depiction: true,
      terms: true,
    },
  });
  await logUserAction(userId, "Get Legislator Data", bioguideId, userRole);
  return data;
};
