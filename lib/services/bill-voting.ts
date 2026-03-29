import prisma from "@/prisma/client";
import { VotePosition } from "@prisma/client";
import { logUserAction } from "./user";
import { getVerifiedSession } from "./bills";

export const voteOnLegislation = async (
  legislationId: number,
  votePosition: VotePosition
) => {
  const { userId, userRole } = await getVerifiedSession();
  if (!userId) {
    throw new Error("Unauthorized: must be signed in to vote");
  }

  const legislation = await prisma.legislation.findUnique({
    where: { id: legislationId },
  });

  if (!legislation) {
    throw new Error(`Legislation with ID ${legislationId} not found`);
  }

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

  return getUserVoteObject(legislationId);
};

export const updateBillTracking = async (
  legislationId: number,
  currentTracking: boolean
) => {
  const { userId, userRole } = await getVerifiedSession();

  if (!userId) {
    throw new Error("Unauthorized: must be signed in to track bills");
  }

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

  await logUserAction(userId, "updateBillTracking", String(legislationId), userRole);

  return getComprehensiveBillData(legislationId);
};

export const getUserVoteObject = async (billId: string | number) => {
  const { userId, userRole } = await getVerifiedSession();

  const whereClause =
    typeof billId === "string" ? { name_id: billId } : { id: billId };

  const billData = await prisma.legislation.findUnique({
    where: whereClause,
  });

  if (!billData) {
    await logUserAction(userId, "getUserVoteObject", String(billId), userRole);
    return null;
  }

  let userVote = null;
  if (userId) {
    userVote = await prisma.userVote.findFirst({
      where: {
        userId,
        entityType: "legislation",
        entityId: billData.id,
      },
    });
  }

  await logUserAction(userId, "voteOnLegislation", String(billId), userRole);

  return { userVote };
};

export const getComprehensiveBillData = async (billId: string | number) => {
  const { userId, userRole } = await getVerifiedSession();

  const whereClause =
    typeof billId === "string" ? { name_id: billId } : { id: billId };

  const billData = await prisma.legislation.findUnique({
    where: whereClause,
    include: {

      userTracks: userId ? { where: { userId } } : false,
      summaries: {
        orderBy: { actionDate: "desc" },
      },
      aiSummaries: {
        orderBy: { actionDate: "desc" },
      },
      actions: {
        orderBy: { actionDate: "desc" },
      },
      relatedBills: {},
    },
  });

  if (!billData) {
    await logUserAction(userId, "getComprehensiveBillData", String(billId), userRole);
    return null;
  }

  let userVote = null;
  if (userId) {
    userVote = await prisma.userVote.findFirst({
      where: {
        userId,
        entityType: "legislation",
        entityId: billData.id,
      },
    });
  }

  const sponsors = await prisma.legislationSponsor.findMany({
    where: { legislationId: billData.id, },



  },);

  const cosponsors = await prisma.legislationCosponsor.findMany({
    where: { legislationId: billData.id },
  });

  const sponsorMembers =
    sponsors.length > 0
      ? await prisma.congressMember.findMany({
        where: {
          bioguideId: { in: sponsors.map((s) => s.sponsorBioguideId) },
        },
        include: { depiction: true },
      })
      : [];

  const cosponsorMembers =
    cosponsors.length > 0
      ? await prisma.congressMember.findMany({
        where: {
          bioguideId: { in: cosponsors.map((c) => c.cosponsorBioguideId) },
        },

        include: { depiction: true },
      })
      : [];

  let congressionalVotes = [];
  if (billData.name_id) {
    const votes = await prisma.vote.findMany({
      where: { name_id: billData.name_id },
      orderBy: { date: "desc" },
    });

    for (const vote of votes) {
      const memberVotes = await prisma.memberVote.findMany({
        where: { voteId: vote.id },
      });

      const memberIds = memberVotes.map((mv) => mv.memberId);
      const members =
        memberIds.length > 0
          ? await prisma.congressMember.findMany({
            where: { id: { in: memberIds } },
            include: { depiction: true },
          })
          : [];

      const memberVotesWithDetails = memberVotes.map((memberVote) => ({
        ...memberVote,
        member: members.find((m) => m.id === memberVote.memberId),
      }));

      congressionalVotes.push({ ...vote, memberVotes: memberVotesWithDetails });
    }
  }

  const latestAction = await prisma.latestAction.findUnique({
    where: { legislation_id: billData.id },
  });

  let policyArea = null;
  if (billData.policy_area_id) {
    policyArea = await prisma.policyArea.findUnique({
      where: { id: billData.policy_area_id },
      select: { id: true, name: true },
    });
  }

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
          memberId: { in: allMemberIds },
        },
        select: { memberId: true, favoritedAt: true },
      });

      favoritedSponsors = favorited.filter((f) =>
        sponsorMembers.some((s) => s.id === f.memberId)
      );
      favoritedCosponsors = favorited.filter((f) =>
        cosponsorMembers.some((c) => c.id === f.memberId)
      );
    }
  }

  await logUserAction(
    userId,
    "getComprehensiveBillData",
    String(billId),
    userRole
  );

  return {
    legislation: billData,
    userVote,
    userTracking: billData.userTracks?.[0] || null,
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
    congressionalVotes,
    latestAction,
    policyArea,
  };
};
