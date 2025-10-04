import prisma from "@/prisma/client";
import type { Vote, MemberVote, VotePosition } from "@prisma/client";

export type BillVoteMember = {
  bioguideId: string;
  firstName: string | null;
  lastName: string | null;
  state: string | null;
  votePosition: VotePosition;
  depiction: {
    imageUrl: string | null;
  } | null;
  isFavorited: boolean;
};

export type BillVote = {
  id: number;
  date: Date;
  description: string | null;
  result: string | null;
  totalYea: number;
  totalNay: number;
  totalNotVoting: number;
  totalPresent: number;
  memberVotes: BillVoteMember[];
  userVote?: UserVoteData | null; // Add user's vote if available
};

export type UserVoteData = {
  id: number;
  votePosition: VotePosition;
  createdAt: Date;
  updatedAt: Date;
};

export const legislationVotesService = {
  async getBillVotes(nameId: string, userId?: string): Promise<BillVote[]> {
    // First get user's favorites if userId provided
    const userFavorites = userId
      ? await prisma.favoritedCongressMember.findMany({
          where: { userId },
          select: { memberId: true },
        })
      : [];

    const favoriteIds = new Set(userFavorites.map((f) => f.memberId));

    // Get legislation ID for user votes lookup
    const legislation = await prisma.legislation.findUnique({
      where: { name_id: nameId },
      select: { id: true },
    });

    const legislationId = legislation?.id;

    // Get all user votes for this legislation if userId provided
    const userVotes =
      userId && legislationId
        ? await prisma.userVote.findMany({
            where: {
              userId,
              entityType: "legislation",
              legislationId,
            },
          })
        : [];

    // Create a map of vote ID to user vote for quick lookup
    const userVotesMap = new Map();

    if (userVotes.length > 0) {
      userVotes.forEach((vote) => {
        userVotesMap.set(vote.entityId, {
          id: vote.id,
          votePosition: vote.votePosition,
          createdAt: vote.createdAt,
          updatedAt: vote.updatedAt,
        });
      });
    }

    const votes = await prisma.vote.findMany({
      where: {
        name_id: nameId,
      },
      include: {
        memberVotes: {
          include: {
            member: {
              select: {
                id: true,
                bioguideId: true,
                firstName: true,
                lastName: true,
                state: true,
                depiction: {
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return votes.map((vote) => ({
      id: vote.id,
      date: vote.date,
      description: vote.description,
      result: vote.result,
      totalYea: vote.totalYea,
      totalNay: vote.totalNay,
      totalNotVoting: vote.totalNotVoting,
      totalPresent: vote.totalPresent,
      memberVotes: vote.memberVotes.map((mv) => ({
        bioguideId: mv.member.bioguideId,
        firstName: mv.member.firstName,
        lastName: mv.member.lastName,
        state: mv.member.state,
        depiction: mv.member.depiction,
        votePosition: mv.votePosition,
        isFavorited: favoriteIds.has(mv.member.id),
      })),
      userVote: userVotesMap.get(vote.id) || null,
    }));
  },

  /**
   * Vote on legislation
   * @param userId The ID of the user casting the vote
   * @param legislationId The ID of the legislation being voted on
   * @param votePosition The user's vote position (YEA, NAY, etc.)
   * @returns The created or updated vote
   */

  /**
   * Get user's vote on a specific legislation
   * @param userId The ID of the user
   * @param legislationId The ID of the legislation
   * @returns The user's vote or null if not found
   */
  async getUserLegislationVote(userId: string, legislationId: number) {
    return await prisma.userVote.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: "legislation",
          entityId: legislationId,
        },
      },
    });
  },

  /**
   * Delete a user's vote on legislation
   * @param userId The ID of the user
   * @param legislationId The ID of the legislation
   * @returns The deleted vote
   */
  async deleteUserLegislationVote(userId: string, legislationId: number) {
    return await prisma.userVote.delete({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: "legislation",
          entityId: legislationId,
        },
      },
    });
  },

  /**
   * Get all votes by a user
   * @param userId The ID of the user
   * @param entityType Optional filter by entity type
   * @returns Array of votes
   */
  async getUserVotes(userId: string, entityType?: string) {
    return await prisma.userVote.findMany({
      where: {
        userId,
        ...(entityType ? { entityType } : {}),
      },
      include: {
        legislation: {
          select: {
            id: true,
            name_id: true,
            title: true,
            type: true,
            number: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  /**
   * Get vote summary for legislation
   * @param legislationId The ID of the legislation
   * @returns Summary of votes (count by position)
   */
  async getLegislationVoteSummary(legislationId: number) {
    const votes = await prisma.userVote.groupBy({
      by: ["votePosition"],
      where: {
        entityType: "legislation",
        entityId: legislationId,
      },
      _count: {
        votePosition: true,
      },
    });

    // Transform into a more usable format
    const summary = {
      YEA: 0,
      NAY: 0,
      PRESENT: 0,
      NOT_VOTING: 0,
      total: 0,
    };

    votes.forEach((vote) => {
      summary[vote.votePosition] = vote._count.votePosition;
      summary.total += vote._count.votePosition;
    });

    return summary;
  },
};
