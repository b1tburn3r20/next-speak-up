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

export const legislationService = {
  async getMemberRecentBills(bioguideId: string, limit = 4): Promise<SponsoredLegislation[]> {
    return prisma.legislation.findMany({
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId
          }
        }
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
            name: true
          }
        },
        latest_action: {
          select: {
            action_date: true,
            text: true
          }
        }
      },
      orderBy: {
        introducedDate: 'desc'
      },
      take: limit
    });
  },

  async getMemberTopPolicyAreas(bioguideId: string, limit = 4): Promise<PolicyAreaCount[]> {
    const policyAreas = await prisma.legislation.groupBy({
      by: ['policy_area_id'],
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId
          }
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id 
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id }
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id
        };
      })
    );

    return policyAreasWithNames;
},

  async getSponsoredLegislationStats(bioguideId: string): Promise<LegislationStats> {
    const policyAreas = await prisma.legislation.groupBy({
      by: ['policy_area_id'],
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId
          }
        }
        // Removed the policy_area_id: { not: null } filter
      },
      _count: {
        id: true
      },
    });

    const total = await prisma.legislation.count({
      where: {
        sponsors: {
          some: {
            sponsorBioguideId: bioguideId
          }
        }
      }
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id 
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id }
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id
        };
      })
    );

    return {
      policyAreas: policyAreasWithNames,
      total
    };
},

async getCosponsoredLegislationStats(bioguideId: string): Promise<LegislationStats> {
  const policyAreas = await prisma.legislation.groupBy({
    by: ['policy_area_id'],
    where: {
      cosponsors: {
        some: {
          cosponsorBioguideId: bioguideId
        }
      }
      // Removed the policy_area_id filter
    },
    _count: {
      id: true
    },
  });

  const total = await prisma.legislation.count({
    where: {
      cosponsors: {
        some: {
          cosponsorBioguideId: bioguideId
        }
      }
    }
  });

  const policyAreasWithNames = await Promise.all(
    policyAreas.map(async (area) => {
      const policyArea = area.policy_area_id 
        ? await prisma.policyArea.findUnique({
            where: { id: area.policy_area_id }
          })
        : null;
      return {
        policy_area: { name: policyArea?.name ?? "Unknown" },
        count: area._count.id
      };
    })
  );

  return {
    policyAreas: policyAreasWithNames,
    total
  };
},

  async getCombinedLegislationStats(bioguideId: string): Promise<LegislationStats> {
    // Debug logging
    console.log("Getting combined stats for:", bioguideId);

    const policyAreas = await prisma.legislation.groupBy({
      by: ['policy_area_id'],
      where: {
        OR: [
          {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId
              }
            }
          },
          {
            cosponsors: {
              some: {
                cosponsorBioguideId: bioguideId
              }
            }
          }
        ]
        // Removed policy_area_id filter to include nulls
      },
      _count: {
        id: true
      },
    });

    // Debug: log raw policy areas
    console.log("Raw policy areas:", policyAreas);

    const total = await prisma.legislation.count({
      where: {
        OR: [
          {
            sponsors: {
              some: {
                sponsorBioguideId: bioguideId
              }
            }
          },
          {
            cosponsors: {
              some: {
                cosponsorBioguideId: bioguideId
              }
            }
          }
        ]
      }
    });

    const policyAreasWithNames = await Promise.all(
      policyAreas.map(async (area) => {
        const policyArea = area.policy_area_id 
          ? await prisma.policyArea.findUnique({
              where: { id: area.policy_area_id }
            })
          : null;
        return {
          policy_area: { name: policyArea?.name ?? "Unknown" },
          count: area._count.id
        };
      })
    );

    // Debug: log processed areas
    console.log("Processed policy areas:", policyAreasWithNames);

    return {
      policyAreas: policyAreasWithNames,
      total
    };
},

  async getAllLegislationStats(bioguideId: string): Promise<CompleteLegislationStats> {
    const [sponsored, cosponsored, combined] = await Promise.all([
      this.getSponsoredLegislationStats(bioguideId),
      this.getCosponsoredLegislationStats(bioguideId),
      this.getCombinedLegislationStats(bioguideId)
    ]);

    return {
      sponsored,
      cosponsored,
      combined
    };
  },

  async getLegislationOverview(bioguideId: string): Promise<LegislationOverview> {
    const [recentBills, topPolicyAreas, totalBills, totalPassed] = await Promise.all([
      this.getMemberRecentBills(bioguideId),
      this.getMemberTopPolicyAreas(bioguideId),
      prisma.legislation.count({
        where: {
          sponsors: {
            some: {
              sponsorBioguideId: bioguideId
            }
          }
        }
      }),
      prisma.legislation.count({
        where: {
          sponsors: {
            some: {
              sponsorBioguideId: bioguideId
            }
          },
          latest_action: {
            text: {
              contains: 'BECAME PUBLIC LAW'
            }
          }
        }
      })
    ]);

    return {
      recentBills,
      topPolicyAreas,
      totalBills,
      totalPassed
    };
  }
};

export default legislationService;