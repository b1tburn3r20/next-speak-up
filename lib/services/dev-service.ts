import prisma from "@/prisma/client";
import { getVerifiedSession } from "./bills";

function requireAdmin(userRole: string | null | undefined) {
  if (userRole !== "Admin" && userRole !== "Super Admin") {
    throw new Error("Unauthorized");
  }
}

export const devService = {
  async getMembersWithMissingInfo(page: number = 1, perPage: number = 50) {
    const { userRole } = await getVerifiedSession();
    requireAdmin(userRole);

    const skip = (page - 1) * perPage;

    const where = {
      active: true,
      AND: [
        {
          OR: [
            { missingContactInfo: null },
            { missingContactInfo: false },
          ],
        },
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
        where,
        select: {
          id: true,
          bioguideId: true,
          name: true,
          contact: true,
          website: true,
          missingContactInfo: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),
      prisma.congressMember.count({ where }),
    ]);

    return {
      members,
      pagination: {
        total,
        pages: Math.ceil(total / perPage),
        currentPage: page,
        perPage,
      },
    };
  },

  async updateMemberInfo(
    bioguideId: string,
    data: { contact?: string; website?: string }
  ) {
    const { userRole } = await getVerifiedSession();
    requireAdmin(userRole);

    return prisma.congressMember.update({
      where: { bioguideId },
      data: {
        ...(data.contact !== undefined && { contact: data.contact }),
        ...(data.website !== undefined && { website: data.website }),
      },
    });
  },

  async toggleMissingContactInfo(bioguideId: string, missingContactInfo: boolean) {
    const { userRole } = await getVerifiedSession();
    requireAdmin(userRole);

    return prisma.congressMember.update({
      where: { bioguideId },
      data: { missingContactInfo },
    });
  },
};
