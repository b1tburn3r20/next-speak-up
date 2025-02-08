import { CongressMember as PrismaCongressMember, Prisma } from "@prisma/client";
import prisma from "@/prisma/client";

export type CongressMember = PrismaCongressMember;

const includeRelations = {
  terms: true,
  partyHistory: true,
  leadership: true,
  depiction: true,
  favoritedBy: true,
} as const;

export const devService = {
  async getMembersWithMissingInfo(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const whereCondition = {
      AND: [
        // Not marked as permanently missing info (either false or null)
        {
          OR: [{ missingContactInfo: false }, { missingContactInfo: null }],
        },
        // And must have at least one field missing OR empty
        {
          OR: [
            { contact: null },
            { contact: "" },
            { website: null },
            { website: "" },
          ],
        },
      ],
    };

    const [members, total] = await Promise.all([
      prisma.congressMember.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: includeRelations,
      }),
      prisma.congressMember.count({
        where: whereCondition,
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
      missingInfo: members.map((member) => ({
        id: member.id,
        name: member.name,
        missingContact: !member.contact,
        missingWebsite: !member.website,
        missingContactInfo: member.missingContactInfo,
      })),
    };
  },

  async updateMemberInfo(
    bioguideId: string,
    data: {
      contact?: string | null;
      website?: string | null;
    }
  ) {
    return prisma.congressMember.update({
      where: { bioguideId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  async toggleMissingContactInfo(bioguideId: string, value: boolean) {
    return prisma.congressMember.update({
      where: { bioguideId },
      data: {
        missingContactInfo: value,
        updatedAt: new Date(),
      },
    });
  },

  async getMissingInfoStats() {
    const [
      totalMembers,
      missingContact,
      missingWebsite,
      missingBoth,
      markedAsMissing,
    ] = await Promise.all([
      prisma.congressMember.count(),
      prisma.congressMember.count({
        where: {
          AND: [
            { OR: [{ contact: null }, { contact: "" }] },
            {
              OR: [{ missingContactInfo: null }, { missingContactInfo: false }],
            },
          ],
        },
      }),
      prisma.congressMember.count({
        where: {
          AND: [
            { OR: [{ website: null }, { website: "" }] },
            {
              OR: [{ missingContactInfo: null }, { missingContactInfo: false }],
            },
          ],
        },
      }),
      prisma.congressMember.count({
        where: {
          AND: [
            {
              OR: [{ contact: null }, { contact: "" }],
            },
            {
              OR: [{ website: null }, { website: "" }],
            },
            {
              OR: [{ missingContactInfo: null }, { missingContactInfo: false }],
            },
          ],
        },
      }),
      prisma.congressMember.count({
        where: {
          missingContactInfo: true,
        },
      }),
    ]);

    return {
      totalMembers,
      missingContact,
      missingWebsite,
      missingBoth,
      markedAsMissing,
      completionRate: {
        contact: ((totalMembers - missingContact) / totalMembers) * 100,
        website: ((totalMembers - missingWebsite) / totalMembers) * 100,
        overall: ((totalMembers - missingBoth) / totalMembers) * 100,
      },
    };
  },
};
