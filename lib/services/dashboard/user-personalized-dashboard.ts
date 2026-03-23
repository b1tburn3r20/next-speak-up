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

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoteAlignment = "AGREE" | "DISAGREE";

export interface RepresentationBill {
  name_id: string;
  title: string | null;
  userVote: "YEA" | "NAY" | "PRESENT" | "NOT_VOTING";
  repVote: "YEA" | "NAY" | "PRESENT" | "NOT_VOTING";
  alignment: VoteAlignment;
}

export interface RepresentationMetrics {
  summary: {
    AGREE: number;
    DISAGREE: number;
  };
  bills: {
    AGREE: RepresentationBill[];
    DISAGREE: RepresentationBill[];
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getRepresentationMetrics(
  userId: string
): Promise<RepresentationMetrics | { error: string; status: 404 | 500 }> {
  try {
    // 1. Fetch user with state + district
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, district: true },
    });

    if (!user?.state || user?.district == null) {
      return {
        error: "User is missing state or district information.",
        status: 404,
      };
    }

    // 2. Find the user's representative by state + district
    const representative = await prisma.congressMember.findFirst({
      where: {
        state: user.state,
        district: String(user.district),
        active: true,
      },
      select: { bioguideId: true, id: true },
    });

    if (!representative) {
      return {
        error: `No active representative found for state=${user.state}, district=${user.district}.`,
        status: 404,
      };
    }

    // 3. Fetch all user votes that have a legislationId
    const userVotes = await prisma.userVote.findMany({
      where: {
        userId,
        legislationId: { not: null },
      },
      select: {
        legislationId: true,
        votePosition: true,
      },
    });

    if (userVotes.length === 0) {
      return {
        summary: { AGREE: 0, DISAGREE: 0 },
        bills: { AGREE: [], DISAGREE: [] },
      };
    }

    const userVoteMap = new Map(
      userVotes.map((v) => [v.legislationId!, v.votePosition])
    );
    const legislationIds = [...userVoteMap.keys()];

    // 4. Find all Vote records tied to these legislation IDs
    //    and check if the rep voted on them via MemberVote
    const votes = await prisma.vote.findMany({
      where: {
        legislation: {
          id: { in: legislationIds },
        },
      },
      select: {
        id: true,
        name_id: true,
        legislation: {
          select: {
            id: true,
            name_id: true,
            title: true,
          },
        },
        memberVotes: {
          where: {
            memberId: representative.id,
          },
          select: {
            votePosition: true,
          },
        },
      },
    });

    // 5. Build a map of legislationId -> { repVote, name_id, title }
    //    A legislation can have multiple Vote records (e.g. House + Senate)
    //    We pick the first one where the rep actually cast a vote.
    type RepVoteEntry = {
      repVote: "YEA" | "NAY" | "PRESENT" | "NOT_VOTING" | null;
      name_id: string;
      title: string | null;
    };

    const repVoteByLegislationId = new Map<number, RepVoteEntry>();

    for (const vote of votes) {
      if (!vote.legislation) continue;
      const legId = vote.legislation.id;

      const existing = repVoteByLegislationId.get(legId);
      const repMemberVote = vote.memberVotes[0] ?? null;

      if (!existing || (existing.repVote === null && repMemberVote)) {
        repVoteByLegislationId.set(legId, {
          repVote: repMemberVote
            ? (repMemberVote.votePosition as RepVoteEntry["repVote"])
            : null,
          name_id: vote.legislation.name_id ?? vote.name_id ?? "",
          title: vote.legislation.title ?? null,
        });
      }
    }

    // 6. Classify each bill — only include bills where both user AND rep voted
    const result: RepresentationMetrics = {
      summary: { AGREE: 0, DISAGREE: 0 },
      bills: { AGREE: [], DISAGREE: [] },
    };

    const counts = { AGREE: 0, DISAGREE: 0 };

    for (const [legId, userVotePosition] of userVoteMap.entries()) {
      const entry = repVoteByLegislationId.get(legId);

      // Skip if no Vote record exists, or rep didn't vote on this bill
      if (!entry || !entry.repVote || !entry.name_id) continue;

      const { repVote, name_id, title } = entry;

      const bill: RepresentationBill = {
        name_id,
        title,
        userVote: userVotePosition as RepresentationBill["userVote"],
        repVote: repVote as RepresentationBill["repVote"],
        alignment: userVotePosition === repVote ? "AGREE" : "DISAGREE",
      };

      if (bill.alignment === "AGREE") {
        counts.AGREE++;
        if (counts.AGREE <= 100) result.bills.AGREE.push(bill);
      } else {
        counts.DISAGREE++;
        if (counts.DISAGREE <= 100) result.bills.DISAGREE.push(bill);
      }
    }

    result.summary = counts;
    return result;
  } catch (error) {
    console.error("Error fetching representation metrics:", error);
    return { error: "Internal server error.", status: 500 };
  }
}
