import prisma from "@/prisma/client";
import {
  getLegislatorRecentHouseVotes,
  getLegislatorHouseVotePolicyAreaBreakdown,
} from "../legislators/legislator-id";

export const getUserRepresentativeData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      state: true,
      district: true,
    },
  });

  if (!user?.state || user?.district == null) return null;

  const representative = await prisma.congressMember.findFirst({
    where: {
      state: user.state,
      district: String(user.district),
      active: true,
    },
    include: {
      depiction: true,
      terms: {
        orderBy: { startYear: "desc" },
      },
    },
  });

  if (!representative) return null;

  const [recentVotes, policyAreaBreakdown] = await Promise.all([
    getLegislatorRecentHouseVotes(representative.bioguideId),
    getLegislatorHouseVotePolicyAreaBreakdown(representative.bioguideId),
  ]);

  return {
    representative,
    recentVotes,
    policyAreaBreakdown,
  };
};
