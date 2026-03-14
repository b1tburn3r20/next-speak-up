import prisma from "@/prisma/client";
import { Chamber, VotePosition } from "@prisma/client";
import { logUserAction } from "../user";

export const getComprehensiveLegislatorInformation = async (
  bioguideId: string,
  userId: string,
  userRole: string
) => {
  const data = await prisma.congressMember.findUnique({
    where: {
      bioguideId: bioguideId,
    },
    include: {
      depiction: true,
      terms: {
        orderBy: {
          startYear: "desc",
        },
      },
    },
  });

  await logUserAction(userId, "Get Legislator Data", bioguideId, userRole);
  return data;
};

export const getLegislatorRecentHouseVotes = async (
  bioguideId: string,
  limit = 100
) => {
  const member = await prisma.congressMember.findUnique({
    where: { bioguideId },
    select: { id: true },
  });

  if (!member) {
    return [];
  }

  // MemberVote has no relation to Vote in the schema — query votes separately
  const memberVotes = await prisma.memberVote.findMany({
    where: {
      memberId: member.id,
    },
    select: {
      id: true,
      voteId: true,
      votePosition: true,
      party: true,
      state: true,
    },
  });

  if (memberVotes.length === 0) return [];

  const voteIds = memberVotes.map((mv) => mv.voteId);

  // Filter to HOUSE votes and fetch vote details
  const votes = await prisma.vote.findMany({
    where: {
      id: { in: voteIds },
      chamber: Chamber.HOUSE,
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
    select: {
      id: true,
      congress: true,
      chamber: true,
      rollNumber: true,
      date: true,
      time: true,
      description: true,
      question: true,
      result: true,
      billNumber: true,
      name_id: true,
      totalYea: true,
      totalNay: true,
      totalPresent: true,
      totalNotVoting: true,
      totalVoting: true,
    },
  });

  // Vote has no direct relation to Legislation — look up by name_id separately
  const nameIds = votes
    .map((v) => v.name_id)
    .filter((id): id is string => id !== null);

  const legislationMap = nameIds.length > 0
    ? await prisma.legislation.findMany({
      where: { name_id: { in: nameIds } },
      select: {
        name_id: true,
        title: true,
        policy_area_id: true,
      },
    })
    : [];

  // PolicyArea has no relation on Legislation — look up by policy_area_id separately
  const policyAreaIds = legislationMap
    .map((l) => l.policy_area_id)
    .filter((id): id is number => id !== null);

  const policyAreas = policyAreaIds.length > 0
    ? await prisma.policyArea.findMany({
      where: { id: { in: policyAreaIds } },
      select: { id: true, name: true },
    })
    : [];

  const policyAreaById = Object.fromEntries(
    policyAreas.map((pa) => [pa.id, pa.name])
  );

  const legislationByNameId = Object.fromEntries(
    legislationMap.map((l) => [
      l.name_id,
      {
        title: l.title,
        policyArea: l.policy_area_id
          ? (policyAreaById[l.policy_area_id] ?? "Uncategorized")
          : "Uncategorized",
      },
    ])
  );

  const memberVoteByVoteId = Object.fromEntries(
    memberVotes.map((mv) => [mv.voteId, mv])
  );

  return votes.map((vote) => {
    const memberVote = memberVoteByVoteId[vote.id];
    const legislation = vote.name_id ? legislationByNameId[vote.name_id] : null;

    return {
      memberVoteId: memberVote?.id ?? null,
      voteId: vote.id,
      votePosition: memberVote?.votePosition ?? null,
      congress: vote.congress,
      chamber: vote.chamber,
      rollNumber: vote.rollNumber,
      date: vote.date,
      time: vote.time,
      description: vote.description,
      question: vote.question,
      result: vote.result,
      billNumber: vote.billNumber,
      nameId: vote.name_id,
      billTitle: legislation?.title ?? null,
      policyArea: legislation?.policyArea ?? "Uncategorized",
      totals: {
        yea: vote.totalYea,
        nay: vote.totalNay,
        present: vote.totalPresent,
        notVoting: vote.totalNotVoting,
        voting: vote.totalVoting,
      },
    };
  });
};
export const getLegislatorHouseVotePolicyAreaBreakdown = async (
  bioguideId: string
) => {
  const member = await prisma.congressMember.findUnique({
    where: { bioguideId },
    select: { id: true },
  });

  if (!member) return [];

  // 1. Get all voteIds + positions for this member — no relation selects
  const memberVotes = await prisma.memberVote.findMany({
    where: { memberId: member.id },
    select: { voteId: true, votePosition: true },
  });

  if (memberVotes.length === 0) return [];

  const voteIds = memberVotes.map((mv) => mv.voteId);

  // 2. Fetch those votes flat, filter HOUSE in JS
  const votes = await prisma.vote.findMany({
    where: { id: { in: voteIds } },
    select: { id: true, chamber: true, name_id: true },
  });

  const houseVotes = votes.filter((v) => v.chamber === Chamber.HOUSE);
  if (houseVotes.length === 0) return [];

  const nameIds = [
    ...new Set(
      houseVotes.map((v) => v.name_id).filter((id): id is string => id !== null)
    ),
  ];

  // 3. Fetch legislation flat
  const legislation = await prisma.legislation.findMany({
    where: { name_id: { in: nameIds } },
    select: { name_id: true, policy_area_id: true },
  });

  const policyAreaIds = [
    ...new Set(
      legislation.map((l) => l.policy_area_id).filter((id): id is number => id !== null)
    ),
  ];

  // 4. Fetch policy area names flat
  const policyAreas = await prisma.policyArea.findMany({
    where: { id: { in: policyAreaIds } },
    select: { id: true, name: true },
  });

  // 5. Build lookup maps in JS
  const policyNameById = Object.fromEntries(policyAreas.map((pa) => [pa.id, pa.name]));

  const policyByNameId = Object.fromEntries(
    legislation.map((l) => [
      l.name_id,
      l.policy_area_id
        ? (policyNameById[l.policy_area_id] ?? "Uncategorized")
        : "Uncategorized",
    ])
  );

  const memberVoteByVoteId = Object.fromEntries(
    memberVotes.map((mv) => [mv.voteId, mv.votePosition])
  );

  // 6. Aggregate entirely in JS
  const breakdown: Record<
    string,
    { policyArea: string; total: number; YEA: number; NAY: number; PRESENT: number; NOT_VOTING: number }
  > = {};

  for (const vote of houseVotes) {
    const votePosition = memberVoteByVoteId[vote.id];
    if (!votePosition) continue;

    const key = vote.name_id ? (policyByNameId[vote.name_id] ?? "Uncategorized") : "Uncategorized";

    if (!breakdown[key]) {
      breakdown[key] = { policyArea: key, total: 0, YEA: 0, NAY: 0, PRESENT: 0, NOT_VOTING: 0 };
    }

    breakdown[key].total += 1;
    breakdown[key][votePosition] += 1;
  }

  return Object.values(breakdown).sort((a, b) => b.total - a.total);
};
