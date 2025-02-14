// app/lib/services/congress.ts
import prisma from "@/prisma/client";

export type CongressMember = {
  id: number;
  bioguideId: string;
  name: string;
  firstName: string;
  lastName: string;
  honorificName: string;
  role: string;
  state: string;
  party: string;
  birthYear: string;
  sponsoredLegislationCount: number;
  cosponsoredLegislationCount: number;
  updateDate: Date;
  createdAt: Date;
  updatedAt: Date;
  terms: CongressTerm[];
  partyHistory: PartyHistory[];
  leadership: LeadershipPosition[];
  depiction: Depiction | null;
  favoritedBy?: { userId: string; favoritedAt: Date }[];
  district?: string;
};

export type CongressTerm = {
  id: number;
  chamber: string;
  startYear: number;
  endYear: number | null;
  memberId: number;
};

export type PartyHistory = {
  id: number;
  partyName: string;
  partyAbbreviation: string;
  startYear: number;
  memberId: number;
};

export type LeadershipPosition = {
  id: number;
  congress: number;
  type: string;
  memberId: number;
};

export type Depiction = {
  id: number;
  imageUrl: string;
  attribution: string | null;
  memberId: number;
};

const includeRelations = {
  terms: true,
  partyHistory: true,
  leadership: true,
  depiction: true,
  favoritedBy: true,
};

export const congressService = {
  async getMemberById(bioguideId: string): Promise<CongressMember | null> {
    return prisma.congressMember.findUnique({
      where: { bioguideId },
      include: includeRelations,
    });
  },

  async toggleFavoriteMember(
    userId: string,
    memberId: number,
    favoriteState?: boolean
  ) {
    const existing = await prisma.favoritedCongressMember.findUnique({
      where: {
        userId_memberId: {
          userId,
          memberId,
        },
      },
    });

    // If favoriteState is provided, use it to determine action
    if (favoriteState !== undefined) {
      if (favoriteState && !existing) {
        return prisma.favoritedCongressMember.create({
          data: {
            userId,
            memberId,
          },
        });
      }
      if (!favoriteState && existing) {
        return prisma.favoritedCongressMember.delete({
          where: {
            userId_memberId: {
              userId,
              memberId,
            },
          },
        });
      }
      return existing; // No action needed if state matches
    }

    // Original toggle behavior if no state provided
    if (existing) {
      return prisma.favoritedCongressMember.delete({
        where: {
          userId_memberId: {
            userId,
            memberId,
          },
        },
      });
    }

    return prisma.favoritedCongressMember.create({
      data: {
        userId,
        memberId,
      },
    });
  },

  async getUserFavorites(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: {
          favoritedBy: {
            some: {
              userId,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count({
        where: {
          favoritedBy: {
            some: {
              userId,
            },
          },
        },
      }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },

  async isMemberFavorited(userId: string, memberId: number) {
    const favorite = await prisma.favoritedCongressMember.findUnique({
      where: {
        userId_memberId: {
          userId,
          memberId,
        },
      },
    });
    return !!favorite;
  },
  async getAllMembers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count(),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },

  async getMembersByParty(party: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: { party },
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count({
        where: { party },
      }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },

  async getMembersByState(state: string) {
    return prisma.congressMember.findMany({
      where: { state },
      orderBy: { name: "asc" },
      include: includeRelations,
    });
  },

  async getMembersByChamber(chamber: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: {
          terms: {
            some: {
              chamber,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count({
        where: {
          terms: {
            some: {
              chamber,
            },
          },
        },
      }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },

  async getCurrentMembers() {
    const currentYear = new Date().getFullYear();
    return prisma.congressMember.findMany({
      where: {
        terms: {
          some: {
            OR: [{ endYear: null }, { endYear: { gte: currentYear } }],
          },
        },
      },
      orderBy: { name: "asc" },
      include: includeRelations,
    });
  },

  async searchMembers(query: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const searchQuery = query.trim();

    const whereClause = {
      AND: [
        {
          sessions: {
            some: {
              congress: 118,
            },
          },
        },
        {
          OR: [
            { bioguideId: searchQuery },
            {
              AND: searchQuery.split(" ").map((term) => ({
                OR: [
                  { name: { contains: term } },
                  { firstName: { contains: term } },
                  { lastName: { contains: term } },
                ],
              })),
            },
            { state: { contains: searchQuery } },
            { birthYear: { contains: searchQuery } },
            { terms: { some: { chamber: { contains: searchQuery } } } },
            { role: { contains: searchQuery } },
          ],
        },
      ],
    };

    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),

      prisma.congressMember.count({
        where: whereClause,
      }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },
  async getMemberStats() {
    const currentYear = new Date().getFullYear();
    const [
      totalMembers,
      partyBreakdown,
      chamberBreakdown,
      currentMembers,
      partyHistoryStats,
      leadershipStats,
    ] = await Promise.all([
      prisma.congressMember.count(),
      prisma.congressMember.groupBy({
        by: ["party"],
        _count: true,
      }),
      prisma.congressTerm.groupBy({
        by: ["chamber"],
        _count: true,
      }),
      prisma.congressMember.count({
        where: {
          terms: {
            some: {
              OR: [{ endYear: null }, { endYear: { gte: currentYear } }],
            },
          },
        },
      }),
      prisma.partyHistory.groupBy({
        by: ["partyName"],
        _count: true,
      }),
      prisma.leadershipPosition.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    return {
      totalMembers,
      partyBreakdown,
      chamberBreakdown,
      currentMembers,
      partyHistoryStats,
      leadershipStats,
    };
  },

  // New methods for the additional data
  async getMemberPartyHistory(bioguideId: string) {
    return prisma.partyHistory.findMany({
      where: {
        congressMember: {
          bioguideId,
        },
      },
      orderBy: {
        startYear: "asc",
      },
    });
  },

  async getMemberTerms(bioguideId: string) {
    return prisma.congressTerm.findMany({
      where: {
        congressMember: {
          bioguideId,
        },
      },
      orderBy: {
        startYear: "asc",
      },
    });
  },

  async getMemberLeadership(bioguideId: string) {
    return prisma.leadershipPosition.findMany({
      where: {
        congressMember: {
          bioguideId,
        },
      },
      orderBy: {
        congress: "asc",
      },
    });
  },
  async getMembersBySession(congress: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: {
          sessions: {
            some: {
              congress,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count({
        where: {
          sessions: {
            some: {
              congress,
            },
          },
        },
      }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  },
};
