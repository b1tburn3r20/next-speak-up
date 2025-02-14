// app/lib/services/congress_two.ts
import prisma from "@/prisma/client";
import type { CongressMember } from "./congress";

export type VoteStats = {
  totalVotes: number;
  totalYea: number;
  totalNay: number;
  totalNotVoting: number;
  totalPresent: number;
};
export type GradeMetric = {
  name: string;
  grade: string;
  score: number;
  description: string;
};

export type CongressMemberGrade = {
  overall: string;
  overallScore: number;
  metrics: GradeMetric[];
};
export type RecentVote = {
  date: Date;
  billName: string | null;
  billTitle: string | null;
  votePosition: string;
  billNameId: string | null; // Added for bill linking
};
// First, let's extend our types
export type VoteWithPolicyArea = {
  date: Date;
  time: string | null;
  billName: string | null;
  billTitle: string | null;
  votePosition: string;
  billNameId: string | null;
  policyArea: string | null;
};

// Group votes by policy area for the pie chart
export type PolicyAreaVoteCount = {
  policyArea: string;
  count: number;
  percentage: number;
  legislation: {
    name_id: string;
    title: string;
    number: string;
    date: Date;
  }[];
};

export type VotesByPolicyArea = {
  all: PolicyAreaVoteCount[];
  yea: PolicyAreaVoteCount[];
  nay: PolicyAreaVoteCount[];
  notVoting: PolicyAreaVoteCount[];
  total: number;
};

export const congressVotesService = {
  async getMemberRecentVotes(memberId: number): Promise<RecentVote[]> {
    const recentVotes = await prisma.memberVote.findMany({
      where: {
        memberId,
      },
      select: {
        votePosition: true,
        vote: {
          select: {
            date: true,
            billNumber: true,
            description: true,
            legislation: {
              select: {
                title: true,
                name_id: true,
              },
            },
          },
        },
      },
      orderBy: {
        vote: {
          date: "desc",
        },
      },
      take: 10,
    });

    return recentVotes.map((vote) => ({
      date: vote.vote.date,
      billName: vote.vote.billNumber,
      billTitle: vote.vote.legislation?.title || vote.vote.description,
      votePosition: vote.votePosition,
      billNameId: vote.vote.legislation?.name_id || null,
    }));
  },

  async getMemberVoteStats(memberId: number): Promise<VoteStats> {
    const voteStats = await prisma.memberVote.groupBy({
      by: ["votePosition"],
      where: {
        memberId,
      },
      _count: true,
    });

    const stats = {
      totalVotes: 0,
      totalYea: 0,
      totalNay: 0,
      totalNotVoting: 0,
      totalPresent: 0,
    };

    voteStats.forEach((stat) => {
      const count = stat._count;
      switch (stat.votePosition) {
        case "YEA":
          stats.totalYea = count;
          break;
        case "NAY":
          stats.totalNay = count;
          break;
        case "NOT_VOTING":
          stats.totalNotVoting = count;
          break;
        case "PRESENT":
          stats.totalPresent = count;
          break;
      }
    });

    stats.totalVotes =
      stats.totalYea +
      stats.totalNay +
      stats.totalNotVoting +
      stats.totalPresent;

    return stats;
  },
  async getMemberVotesByPolicyArea(
    memberId: number
  ): Promise<VotesByPolicyArea> {
    const votes = await prisma.memberVote.findMany({
      where: {
        memberId,
      },
      select: {
        votePosition: true,
        vote: {
          select: {
            date: true,
            time: true,
            billNumber: true,
            description: true,
            legislation: {
              select: {
                title: true,
                name_id: true,
                number: true,
                policy_area: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Helper function to calculate policy area stats with legislation
    const calculatePolicyAreaStats = (filteredVotes: typeof votes) => {
      const policyAreaMap: Record<
        string,
        {
          count: number;
          legislation: {
            name_id: string;
            title: string;
            number: string;
            date: Date;
          }[];
        }
      > = {};

      filteredVotes.forEach((vote) => {
        const policyArea =
          vote.vote.legislation?.policy_area?.name || "Uncategorized";

        if (!policyAreaMap[policyArea]) {
          policyAreaMap[policyArea] = {
            count: 0,
            legislation: [],
          };
        }

        policyAreaMap[policyArea].count += 1;

        if (vote.vote.legislation) {
          policyAreaMap[policyArea].legislation.push({
            name_id: vote.vote.legislation.name_id || "",
            title: vote.vote.legislation.title || vote.vote.description || "",
            number: vote.vote.billNumber || "",
            date: vote.vote.date,
          });
        }
      });

      const total = filteredVotes.length;

      return Object.entries(policyAreaMap).map(([policyArea, data]) => ({
        policyArea,
        count: data.count,
        percentage: (data.count / total) * 100,
        legislation: data.legislation,
      }));
    };

    const allVotes = calculatePolicyAreaStats(votes);
    const yeaVotes = calculatePolicyAreaStats(
      votes.filter((v) => v.votePosition === "YEA")
    );
    const nayVotes = calculatePolicyAreaStats(
      votes.filter((v) => v.votePosition === "NAY")
    );
    const notVotingVotes = calculatePolicyAreaStats(
      votes.filter((v) => v.votePosition === "NOT_VOTING")
    );

    return {
      all: allVotes,
      yea: yeaVotes,
      nay: nayVotes,
      notVoting: notVotingVotes,
      total: votes.length,
    };
  },

  async getMemberVotesWithPolicyArea(
    memberId: number,
    position?: "YEA" | "NAY" | "NOT_VOTING"
  ): Promise<VoteWithPolicyArea[]> {
    const votes = await prisma.memberVote.findMany({
      where: {
        memberId,
        ...(position && { votePosition: position }),
      },
      select: {
        votePosition: true,
        vote: {
          select: {
            date: true,
            time: true,
            billNumber: true,
            description: true,
            legislation: {
              select: {
                title: true,
                name_id: true,
                policy_area: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        vote: {
          date: "desc",
        },
      },
    });

    return votes.map((vote) => ({
      date: vote.vote.date,
      time: vote.vote.time,
      billName: vote.vote.billNumber,
      billTitle: vote.vote.legislation?.title || vote.vote.description,
      votePosition: vote.votePosition,
      billNameId: vote.vote.legislation?.name_id || null,
      policyArea: vote.vote.legislation?.policy_area?.name || null,
    }));
  },
  async getMemberVoteAttendance(memberId: number): Promise<number> {
    const stats = await prisma.memberVote.groupBy({
      by: ["votePosition"],
      where: {
        memberId,
      },
      _count: true,
    });

    let totalVotes = 0;
    let absentVotes = 0;

    stats.forEach((stat) => {
      const count = stat._count;
      switch (stat.votePosition) {
        case "NOT_VOTING":
        case "PRESENT":
          absentVotes += count;
          totalVotes += count;
          break;
        case "YEA":
        case "NAY":
          totalVotes += count;
          break;
      }
    });

    // Return attendance percentage (0-100)
    return totalVotes > 0 ? ((totalVotes - absentVotes) / totalVotes) * 100 : 0;
  },

  getGradeFromPercentage(percentage: number): string {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  },

  async getCongressMemberGrade(memberId: number): Promise<CongressMemberGrade> {
    // Get attendance score
    const attendanceScore = await this.getMemberVoteAttendance(memberId);
    const attendanceGrade = this.getGradeFromPercentage(attendanceScore);

    // Create metrics array (currently only attendance)
    const metrics: GradeMetric[] = [
      {
        name: "Vote Attendance",
        grade: attendanceGrade,
        score: attendanceScore,
        description: "Percentage of votes where member cast a Yea or Nay vote",
      },
    ];

    // For now, overall grade is just the attendance grade
    // In the future, this will be an average of multiple metrics
    return {
      overall: attendanceGrade,
      overallScore: attendanceScore,
      metrics,
    };
  },
};
