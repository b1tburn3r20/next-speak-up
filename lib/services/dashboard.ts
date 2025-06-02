// app/lib/services/dashboard.ts
import prisma from "@/prisma/client";
import { congressService } from "./congress";

export type UserDashboardStats = {
  favoriteMembers: Array<{
    member: any;
    votingAlignment: number | null;
    sharedVoteCount: number;
  }>;
  stateRepresentatives?: Array<{
    member: any;
    votingAlignment: number | null;
    sharedVoteCount: number;
  }>;
  recentVotingActivity: {
    totalUserVotes: number;
    recentUserVotes: any[];
    recentCongressVotes: any[];
  };
  policyAreaEngagement: Array<{
    policyArea: string;
    count: number;
    userVoteCount: number;
  }>;
};

export const dashboardService = {
  /**
   * Get dashboard data for a specific user
   */
  async getUserDashboard(userId: string): Promise<UserDashboardStats> {
    // Get user details including state for finding representatives
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        state: true,
        favoritedMembers: {
          include: {
            member: {
              include: {
                terms: true,
                partyHistory: true,
                leadership: true,
                depiction: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get state representatives if user has a state set
    const stateRepresentatives = user.state
      ? await congressService.getMembersByState(user.state)
      : [];

    // Combine favorited members and state representatives (if not already favorited)
    const favoriteIds = new Set(
      user.favoritedMembers.map((fav) => fav.member.id)
    );

    const allRelevantMembers = [
      ...user.favoritedMembers.map((fav) => fav.member),
      ...stateRepresentatives.filter((rep) => !favoriteIds.has(rep.id)),
    ];

    // Calculate voting alignment for each member
    const memberAlignments = await Promise.all(
      allRelevantMembers.map(async (member) => {
        const alignment = await this.calculateVotingAlignment(
          userId,
          member.id
        );
        return {
          member,
          votingAlignment: alignment.alignmentPercentage,
          sharedVoteCount: alignment.sharedVoteCount,
        };
      })
    );

    // Separate favorited members from state representatives
    const favoriteMembers = memberAlignments.filter((item) =>
      favoriteIds.has(item.member.id)
    );

    const stateReps = user.state
      ? memberAlignments.filter(
          (item) =>
            !favoriteIds.has(item.member.id) && item.member.state === user.state
        )
      : [];

    // Get recent voting activity
    const recentActivity = await this.getUserVotingActivity(userId);

    // Get policy area engagement
    const policyEngagement = await this.getUserPolicyAreaEngagement(userId);

    return {
      favoriteMembers,
      stateRepresentatives: stateReps,
      recentVotingActivity: recentActivity,
      policyAreaEngagement: policyEngagement,
    };
  },

  /**
   * Calculate voting alignment between a user and a congress member
   */
  async calculateVotingAlignment(
    userId: string,
    memberId: number
  ): Promise<{ alignmentPercentage: number | null; sharedVoteCount: number }> {
    // Find votes where both the user and congress member have voted
    // This query needs to handle both direct vote entityType and legislation entityType
    const sharedVotes = await prisma.$queryRaw<
      Array<{ vote_id: number; user_position: string; member_position: string }>
    >`
      SELECT 
        mv.voteId as vote_id, 
        uv.votePosition as user_position, 
        mv.votePosition as member_position
      FROM membervote mv
      JOIN uservote uv ON 
        (
          (uv.entityType = 'vote' AND uv.entityId = mv.voteId) OR
          (uv.entityType = 'legislation' AND EXISTS (
            SELECT 1 FROM vote v
            WHERE v.id = mv.voteId AND v.name_id = (
              SELECT name_id FROM legislation WHERE id = uv.legislationId
            )
          ))
        )
      WHERE 
        uv.userId = ${userId} AND
        mv.memberId = ${memberId}
    `;

    // Alternative approach if the above is too complex
    if (sharedVotes.length === 0) {
      // Try matching through legislation
      const sharedLegislationVotes = await prisma.$queryRaw<
        Array<{
          vote_id: number;
          user_position: string;
          member_position: string;
        }>
      >`
        SELECT 
          mv.voteId as vote_id,
          uv.votePosition as user_position,
          mv.votePosition as member_position
        FROM uservote uv
        JOIN legislation l ON uv.legislationId = l.id
        JOIN vote v ON v.name_id = l.name_id
        JOIN membervote mv ON mv.voteId = v.id
        WHERE 
          uv.userId = ${userId} AND
          mv.memberId = ${memberId} AND
          uv.entityType = 'legislation'
      `;

      if (sharedLegislationVotes.length > 0) {
        const matchingVotes = sharedLegislationVotes.filter(
          (vote) => vote.user_position === vote.member_position
        ).length;

        const alignmentPercentage =
          (matchingVotes / sharedLegislationVotes.length) * 100;

        return {
          alignmentPercentage: Number(alignmentPercentage.toFixed(1)),
          sharedVoteCount: sharedLegislationVotes.length,
        };
      }
    }

    if (sharedVotes.length === 0) {
      return { alignmentPercentage: null, sharedVoteCount: 0 };
    }

    // Count matching votes
    const matchingVotes = sharedVotes.filter(
      (vote) => vote.user_position === vote.member_position
    ).length;

    const alignmentPercentage = (matchingVotes / sharedVotes.length) * 100;

    return {
      alignmentPercentage: Number(alignmentPercentage.toFixed(1)),
      sharedVoteCount: sharedVotes.length,
    };
  },

  /**
   * Get user's recent voting activity and related congress votes
   */
  async getUserVotingActivity(userId: string) {
    // Get recent user votes
    const recentUserVotes = await prisma.userVote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        legislation: {
          include: {
            policy_area: true,
          },
        },
      },
    });

    // Get total user votes
    const totalUserVotes = await prisma.userVote.count({
      where: { userId },
    });

    // Get recent congress votes
    const recentCongressVotes = await prisma.vote.findMany({
      orderBy: { date: "desc" },
      take: 10,
      include: {
        legislation: {
          include: {
            policy_area: true,
          },
        },
      },
    });

    return {
      totalUserVotes,
      recentUserVotes,
      recentCongressVotes,
    };
  },

  /**
   * Get user's engagement with different policy areas
   */
  async getUserPolicyAreaEngagement(userId: string) {
    const policyAreaEngagement = await prisma.$queryRaw<
      Array<{ policy_area: string; count: number; user_vote_count: number }>
    >`
      SELECT 
        pa.name as policy_area,
        COUNT(DISTINCT l.id) as count,
        COUNT(DISTINCT uv.id) as user_vote_count
      FROM policyarea pa
      JOIN legislation l ON l.policy_area_id = pa.id
      LEFT JOIN uservote uv ON uv.legislationId = l.id AND uv.userId = ${userId}
      GROUP BY pa.id, pa.name
      ORDER BY user_vote_count DESC, count DESC
    `;

    return policyAreaEngagement.map((item) => ({
      policyArea: item.policy_area || "Uncategorized",
      count: Number(item.count),
      userVoteCount: Number(item.user_vote_count),
    }));
  },

  /**
   * Get bills where the user and a specific member have both voted
   */
  async getSharedVotingHistory(userId: string, memberId: number, limit = 10) {
    const sharedVotes = await prisma.$queryRaw<any[]>`
      SELECT 
        v.id as vote_id,
        v.description,
        v.date,
        uv.votePosition as user_position,
        mv.votePosition as member_position,
        l.title,
        l.name_id,
        l.id as legislation_id,
        pa.name as policy_area
      FROM vote v
      JOIN uservote uv ON uv.entityType = 'vote' AND uv.entityId = v.id
      JOIN membervote mv ON mv.voteId = v.id
      LEFT JOIN legislation l ON v.name_id = l.name_id
      LEFT JOIN policyarea pa ON l.policy_area_id = pa.id
      WHERE uv.userId = ${userId} AND mv.memberId = ${memberId}
      ORDER BY v.date DESC
      LIMIT ${limit}
    `;

    return sharedVotes.map((vote) => ({
      voteId: vote.vote_id,
      description: vote.description,
      date: vote.date,
      userPosition: vote.user_position,
      memberPosition: vote.member_position,
      title: vote.title,
      nameId: vote.name_id,
      legislationId: vote.legislation_id,
      policyArea: vote.policy_area,
      match: vote.user_position === vote.member_position,
    }));
  },

  /**
   * Get summary of user's voting patterns compared to different parties
   */
  async getUserPartyAlignment(userId: string) {
    const partyAlignment = await prisma.$queryRaw<
      Array<{ party: string; matched_votes: number; total_votes: number }>
    >`
      SELECT 
        mv.party,
        SUM(CASE WHEN uv.votePosition = mv.votePosition THEN 1 ELSE 0 END) as matched_votes,
        COUNT(*) as total_votes
      FROM uservote uv
      JOIN membervote mv ON uv.entityType = 'vote' AND uv.entityId = mv.voteId
      WHERE uv.userId = ${userId}
      GROUP BY mv.party
      HAVING COUNT(*) > 5
      ORDER BY (SUM(CASE WHEN uv.votePosition = mv.votePosition THEN 1 ELSE 0 END) / COUNT(*)) DESC
    `;

    return partyAlignment.map((item) => ({
      party: item.party || "Unknown",
      matchezVotes: Number(item.matched_votes),
      totalVotes: Number(item.total_votes),
      alignmentPercentage: Number(
        ((Number(item.matched_votes) / Number(item.total_votes)) * 100).toFixed(
          1
        )
      ),
    }));
  },
};