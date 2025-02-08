import prisma from "@/prisma/client";

export type SponsoredLegislation = {
  id: number;
  congress: number | null;
  introducedDate: Date | null;
  number: string | null;
  title: string | null;
  type: string | null;
  url: string | null;
  policy_area: {
    name: string | null;
  } | null;
  latest_action: {
    action_date: Date | null;
    text: string | null;
  } | null;
};

export type PolicyAreaCount = {
  policy_area: {
    name: string | null;
  } | null;
  count: number;
};

export type LegislationStats = {
  policyAreas: PolicyAreaCount[];
  total: number;
};

export type LegislationOverview = {
  recentBills: SponsoredLegislation[];
  topPolicyAreas: PolicyAreaCount[];
  totalBills: number;
  totalPassed: number;
};

export type CompleteLegislationStats = {
  sponsored: LegislationStats;
  cosponsored: LegislationStats;
  combined: LegislationStats;
};
// Add new types
export type MemberBillsFilter = {
  bioguideId: string;
  page?: number;
  limit?: number;
  includeSponsored?: boolean;
  includeCosponsored?: boolean;
  sortBy?: "introducedDate" | "title";
  sortOrder?: "asc" | "desc";
  congress?: number;
  policyAreaId?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type MemberBillsResponse = {
  bills: Array<
    SponsoredLegislation & {
      sponsors: Array<{
        sponsor: {
          name: string | null;
          state: string | null;
          party: string | null;
        };
      }>;
      cosponsors: Array<{
        cosponsor: {
          name: string | null;
          state: string | null;
          party: string | null;
        };
      }>;
    }
  >;
  total: number;
  page: number;
  totalPages: number;
};

export const legislationService = {
  async getMemberRecentBills(
    bioguideId: string,
    limit = 4
  ): Promise<SponsoredLegislation[]> {
    return prisma.legislation.findMany({
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId,
          },
        },
      },
      select: {
        id: true,
        congress: true,
        introducedDate: true,
        number: true,
        title: true,
        type: true,
        url: true,
        policy_area: {
          select: {
            name: true,
          },
        },
        latest_action: {
          select: {
            action_date: true,
            text: true,
          },
        },
      },
      orderBy: {
        introducedDate: "desc",
      },
      take: limit,
    });
  },

  async getMemberTopPolicyAreas(
    bioguideId: string,
    limit = 4
  ): Promise<PolicyAreaCount[]> {
    const policyAreas = await prisma.legislation.groupBy({
      by: ["policy_area_id"],
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId,
          },
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id },
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id,
        };
      })
    );

    return policyAreasWithNames;
  },

  async getSponsoredLegislationStats(
    bioguideId: string
  ): Promise<LegislationStats> {
    const policyAreas = await prisma.legislation.groupBy({
      by: ["policy_area_id"],
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId,
          },
        },
        // Removed the policy_area_id: { not: null } filter
      },
      _count: {
        id: true,
      },
    });

    const total = await prisma.legislation.count({
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId,
          },
        },
      },
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id },
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id,
        };
      })
    );

    return {
      policyAreas: policyAreasWithNames,
      total,
    };
  },

  async getCosponsoredLegislationStats(
    bioguideId: string
  ): Promise<LegislationStats> {
    const policyAreas = await prisma.legislation.groupBy({
      by: ["policy_area_id"],
      where: {
        cosponsors: {
          some: {
            cosponsorBioguideId: bioguideId,
          },
        },
        // Removed the policy_area_id filter
      },
      _count: {
        id: true,
      },
    });

    const total = await prisma.legislation.count({
      where: {
        cosponsors: {
          some: {
            cosponsorBioguideId: bioguideId,
          },
        },
      },
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id },
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id,
        };
      })
    );

    return {
      policyAreas: policyAreasWithNames,
      total,
    };
  },

  async getCombinedLegislationStats(
    bioguideId: string
  ): Promise<LegislationStats> {
    // Debug logging

    const policyAreas = await prisma.legislation.groupBy({
      by: ["policy_area_id"],
      where: {
        OR: [
          {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId,
              },
            },
          },
          {
            cosponsors: {
              some: {
                cosponsorBioguideId: bioguideId,
              },
            },
          },
        ],
        // Removed policy_area_id filter to include nulls
      },
      _count: {
        id: true,
      },
    });

    // Debug: log raw policy areas

    const total = await prisma.legislation.count({
      where: {
        OR: [
          {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId,
              },
            },
          },
          {
            cosponsors: {
              some: {
                cosponsorBioguideId: bioguideId,
              },
            },
          },
        ],
      },
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id },
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id,
        };
      })
    );

    // Debug: log processed areas

    return {
      policyAreas: policyAreasWithNames,
      total,
    };
  },
  async searchLegislation(query: string, tags: string[], page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Build the where clause based on query and tags
    const baseSearchConditions = query
      ? [
          { title: { contains: query } },
          { number: { contains: query } },
          { policy_area: { name: { contains: query } } },
          { type: { contains: query } },
        ]
      : [];

    // Create AND conditions for tags
    const tagConditions = tags.map((tag) => ({
      OR: [
        { title: { contains: tag } },
        { number: { contains: tag } },
        { policy_area: { name: { contains: tag } } },
        { type: { contains: tag } },
      ],
    }));

    // Combine query and tag conditions
    const whereClause = {
      AND: [
        // Only include base search if query exists
        ...(query ? [{ OR: baseSearchConditions }] : []),
        // Include all tag conditions
        ...tagConditions,
      ],
    };

    const searchResults = await prisma.legislation.findMany({
      where: whereClause,
      include: {
        policy_area: {
          select: {
            name: true,
          },
        },
        latest_action: {
          select: {
            action_date: true,
            text: true,
          },
        },
        sponsors: {
          include: {
            sponsor: {
              select: {
                firstName: true,
                lastName: true,
                state: true,
                party: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        introducedDate: "desc",
      },
    });

    const total = await prisma.legislation.count({
      where: whereClause,
    });

    return {
      results: searchResults,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
  async getAllLegislationStats(
    bioguideId: string
  ): Promise<CompleteLegislationStats> {
    const [sponsored, cosponsored, combined] = await Promise.all([
      this.getSponsoredLegislationStats(bioguideId),
      this.getCosponsoredLegislationStats(bioguideId),
      this.getCombinedLegislationStats(bioguideId),
    ]);

    return {
      sponsored,
      cosponsored,
      combined,
    };
  },

  async getLegislationOverview(
    bioguideId: string
  ): Promise<LegislationOverview> {
    const [recentBills, topPolicyAreas, totalBills, totalPassed] =
      await Promise.all([
        this.getMemberRecentBills(bioguideId),
        this.getMemberTopPolicyAreas(bioguideId),
        prisma.legislation.count({
          where: {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId,
              },
            },
          },
        }),
        prisma.legislation.count({
          where: {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId,
              },
            },
            latest_action: {
              text: {
                contains: "BECAME PUBLIC LAW",
              },
            },
          },
        }),
      ]);

    return {
      recentBills,
      topPolicyAreas,
      totalBills,
      totalPassed,
    };
  },

  async getMemberBills({
    bioguideId,
    page = 1,
    limit = 10,
    includeSponsored = true,
    includeCosponsored = true,
    sortBy = "introducedDate",
    sortOrder = "desc",
    congress,
    policyAreaId,
    dateFrom,
    dateTo,
  }: MemberBillsFilter): Promise<MemberBillsResponse> {
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {
      OR: [] as any[],
      AND: [] as any[],
    };

    // Add sponsored/cosponsored conditions
    if (includeSponsored) {
      where.OR.push({
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId,
          },
        },
      });
    }

    if (includeCosponsored) {
      where.OR.push({
        cosponsors: {
          some: {
            cosponsorBioguideId: bioguideId,
          },
        },
      });
    }

    // Add additional filters
    if (congress) {
      where.AND.push({ congress });
    }

    if (policyAreaId) {
      where.AND.push({ policy_area_id: policyAreaId });
    }

    if (dateFrom || dateTo) {
      where.AND.push({
        introducedDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      });
    }

    // If no OR conditions, return empty result
    if (where.OR.length === 0) {
      return {
        bills: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [bills, total] = await Promise.all([
      prisma.legislation.findMany({
        where,
        include: {
          policy_area: {
            select: {
              name: true,
            },
          },
          latest_action: {
            select: {
              action_date: true,
              text: true,
            },
          },
          sponsors: {
            include: {
              sponsor: {
                select: {
                  name: true,
                  state: true,
                  party: true,
                },
              },
            },
          },
          cosponsors: {
            include: {
              cosponsor: {
                select: {
                  name: true,
                  state: true,
                  party: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.legislation.count({ where }),
    ]);

    return {
      bills,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
  async getBillByNameId(nameId: string) {
    const bill = await prisma.legislation.findUnique({
      where: {
        name_id: nameId.toUpperCase(),
      },
      include: {
        policy_area: true,
        latest_action: true,
        sponsors: {
          include: {
            sponsor: {
              select: {
                bioguideId: true,
                name: true,
                state: true,
                party: true,
                depiction: true,
              },
            },
          },
        },
        cosponsors: {
          include: {
            cosponsor: {
              select: {
                bioguideId: true,
                name: true,
                state: true,
                party: true,
                depiction: true,
              },
            },
          },
        },
      },
    });

    return bill;
  },
};

export default legislationService;
