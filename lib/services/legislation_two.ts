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
    }));
  },
};
