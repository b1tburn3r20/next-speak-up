import prisma from "@/prisma/client";
import { VotePosition } from "@prisma/client";

export const voteOnLegislation = async (
  userId: string,
  legislationId: number,
  votePosition: VotePosition
) => {
  // Check if legislation exists
  const legislation = await prisma.legislation.findUnique({
    where: { id: legislationId },
  });

  if (!legislation) {
    throw new Error(`Legislation with ID ${legislationId} not found`);
  }

  // Use upsert to either create a new vote or update an existing one
  return await prisma.userVote.upsert({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: "legislation",
        entityId: legislationId,
      },
    },
    update: {
      votePosition,
      updatedAt: new Date(),
    },
    create: {
      userId,
      votePosition,
      entityType: "legislation",
      entityId: legislationId,
      legislationId,
    },
  });
};
