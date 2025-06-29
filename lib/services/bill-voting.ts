import prisma from "@/prisma/client";
import { VotePosition } from "@prisma/client";
import { logUserAction } from "./user";

export const voteOnLegislation = async (
  userId: string,
  legislationId: number,
  votePosition: VotePosition,
  role: string
) => {
  // Check if legislation exists
  const legislation = await prisma.legislation.findUnique({
    where: { id: legislationId },
  });

  if (!legislation) {
    throw new Error(`Legislation with ID ${legislationId} not found`);
  }

  // Use upsert to either create a new vote or update an existing one
  await prisma.userVote.upsert({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: "legislation",
        entityId: legislationId,
      },
    },
    update: {
      votePosition,
      updatedAt: new Date(),
    },
    create: {
      userId,
      votePosition,
      entityType: "legislation",
      entityId: legislationId,
      legislationId,
    },
  });
  return getComprehensiveBillData(legislationId, userId, role);
};

export const updateBillTracking = async (
  userId: string,
  legislationId: number,
  currentTracking: boolean,
  role: string
) => {
  const newTrackingStatus = !currentTracking;

  await prisma.userBillTrack.upsert({
    where: {
      userId_legislationId: {
        userId,
        legislationId,
      },
    },
    update: {
      tracking: newTrackingStatus,
    },
    create: {
      userId,
      legislationId,
      tracking: newTrackingStatus,
    },
  });
  await logUserAction(
    userId,
    "updateBillTracking",
    String(legislationId),
    role
  );
  return getComprehensiveBillData(legislationId, userId, role);
};

export const getComprehensiveBillData = async (
  billId: number,
  userId: string | null,
  userRole: string
) => {
  // Get the main legislation data with all related information
  const billData = await prisma.legislation.findUnique({
    where: {
      id: billId,
    },
    include: {
      // Include user's tracking data if authenticated
      userTracks: userId
        ? {
            where: { userId },
          }
        : false,
      // Add the missing summaries
      summaries: {
        orderBy: {
          actionDate: "desc",
        },
      },
      aiSummaries: {
        orderBy: {
          actionDate: "desc",
        },
      },
    },
  });

  if (!billData) {
    await logUserAction(
      userId,
      "getComprehensiveBillData",
      String(billId),
      userRole
    );
    return null;
  }

  // Get user's vote on this legislation if they're authenticated
  let userVote = null;
  if (userId) {
    userVote = await prisma.userVote.findFirst({
      where: {
        userId,
        entityType: "legislation", // Assuming this is how you track legislation votes
        entityId: billId,
      },
    });
  }

  // Get sponsors of the legislation
  const sponsors = await prisma.legislationSponsor.findMany({
    where: {
      legislationId: billId,
    },
  });

  // Get cosponsors of the legislation
  const cosponsors = await prisma.legislationCosponsor.findMany({
    where: {
      legislationId: billId,
    },
  });

  // Get sponsor member details
  const sponsorMembers =
    sponsors.length > 0
      ? await prisma.congressMember.findMany({
          where: {
            bioguideId: {
              in: sponsors.map((s) => s.sponsorBioguideId),
            },
          },
        })
      : [];

  // Get cosponsor member details
  const cosponsorMembers =
    cosponsors.length > 0
      ? await prisma.congressMember.findMany({
          where: {
            bioguideId: {
              in: cosponsors.map((c) => c.cosponsorBioguideId),
            },
          },
        })
      : [];

  // Get related votes (if the legislation has associated congressional votes)
  let congressionalVotes = [];
  if (billData.name_id) {
    const votes = await prisma.vote.findMany({
      where: {
        name_id: billData.name_id,
      },

      orderBy: {
        date: "desc",
      },
    });

    // Get member votes for each congressional vote
    for (const vote of votes) {
      const memberVotes = await prisma.memberVote.findMany({
        where: {
          voteId: vote.id,
        },
      });

      // Get member details for the votes
      const memberIds = memberVotes.map((mv) => mv.memberId);
      const members =
        memberIds.length > 0
          ? await prisma.congressMember.findMany({
              where: {
                id: {
                  in: memberIds,
                },
              },
            })
          : [];

      // Combine member votes with member details
      const memberVotesWithDetails = memberVotes.map((memberVote) => ({
        ...memberVote,
        member: members.find((m) => m.id === memberVote.memberId),
      }));

      congressionalVotes.push({
        ...vote,
        memberVotes: memberVotesWithDetails,
      });
    }
  }

  // Get latest action for the bill
  const latestAction = await prisma.latestAction.findUnique({
    where: {
      legislation_id: billId,
    },
  });

  // Get policy area if it exists
  let policyArea = null;
  if (billData.policy_area_id) {
    policyArea = await prisma.policyArea.findUnique({
      where: {
        id: billData.policy_area_id,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  // Check if user has favorited any of the sponsors/cosponsors (if authenticated)
  let favoritedSponsors = [];
  let favoritedCosponsors = [];
  if (userId) {
    const allMemberIds = [...sponsorMembers, ...cosponsorMembers].map(
      (m) => m.id
    );
    if (allMemberIds.length > 0) {
      const favorited = await prisma.favoritedCongressMember.findMany({
        where: {
          userId,
          memberId: {
            in: allMemberIds,
          },
        },
        select: {
          memberId: true,
          favoritedAt: true,
        },
      });

      favoritedSponsors = favorited.filter((f) =>
        sponsorMembers.some((s) => s.id === f.memberId)
      );
      favoritedCosponsors = favorited.filter((f) =>
        cosponsorMembers.some((c) => c.id === f.memberId)
      );
    }
  }

  // Log the action
  await logUserAction(
    userId,
    "getComprehensiveBillData",
    String(billId),
    userRole
  );

  // Return comprehensive bill data
  return {
    // Main legislation data
    legislation: billData,

    // User-specific data (null for guests)
    userVote,
    userTracking: billData.userTracks?.[0] || null,

    // Sponsors and cosponsors with member details
    sponsors: sponsorMembers.map((member) => ({
      ...member,
      isFavorited: favoritedSponsors.some((f) => f.memberId === member.id),
      favoritedAt:
        favoritedSponsors.find((f) => f.memberId === member.id)?.favoritedAt ||
        null,
    })),

    cosponsors: cosponsorMembers.map((member) => ({
      ...member,
      isFavorited: favoritedCosponsors.some((f) => f.memberId === member.id),
      favoritedAt:
        favoritedCosponsors.find((f) => f.memberId === member.id)
          ?.favoritedAt || null,
    })),

    // Congressional votes and member votes
    congressionalVotes,

    // Additional related data
    latestAction,
    policyArea,

    // Now includes summaries and AI summaries
    summaries: billData.summaries || [],
    aiSummaries: billData.aiSummaries || [],

    // Summary counts
    summary: {
      totalSponsors: sponsorMembers.length,
      totalCosponsors: cosponsorMembers.length,
      totalCongressionalVotes: congressionalVotes.length,
      totalSummaries: billData.summaries?.length || 0,
      totalAiSummaries: billData.aiSummaries?.length || 0,
      hasUserVoted: userVote !== null,
      isUserTracking: billData.userTracks?.[0]?.hasViewed || false,
    },
  };
};
