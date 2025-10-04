import prisma from "@/prisma/client";
import { logUserAction } from "../user";

export const searchLegislation = async (query, userId, userRole) => {
  console.log(query);
  const results = await prisma.legislation.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { number: { contains: query } },
        { name_id: { contains: query } },
      ],
    },
    select: {
      title: true,
      name_id: true,
      id: true,
      introducedDate: true,
    },
    take: 5,
  });
  await logUserAction(userId, "Search Bills", query, userRole);
  return results;
};
