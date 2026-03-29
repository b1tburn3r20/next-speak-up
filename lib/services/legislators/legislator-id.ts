import prisma from "@/prisma/client";
import { Chamber, VotePosition } from "@prisma/client";
import { logUserAction } from "../user";
import { getVerifiedSession } from "../bills";

export const getComprehensiveLegislatorInformation = async (
  bioguideId: string,
) => {
  const { userId, userRole } = await getVerifiedSession()
  const [data, sponsoredCount, cosponsoredCount] = await Promise.all([
    prisma.congressMember.findUnique({
      where: { bioguideId },
      include: {
        depiction: true,
        terms: {
          orderBy: {
            startYear: "desc",
          },
        },
      },
    }),
    prisma.legislationSponsor.count({
      where: { sponsorBioguideId: bioguideId },
    }),
    prisma.legislationCosponsor.count({
      where: { cosponsorBioguideId: bioguideId },
    }),
  ]);

  await logUserAction(userId, "Get Legislator Data", bioguideId, userRole);

  if (!data) return null;

  return {
    ...data,
    sponsoredLegislationCount: sponsoredCount,
    cosponsoredLegislationCount: cosponsoredCount,
  };
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
  const memberVotes = await prisma.memberVote.findMany({
    where: { memberId: member.id },
    select: { voteId: true, votePosition: true },
  });

  if (memberVotes.length === 0) return [];

  const voteIds = memberVotes.map((mv) => mv.voteId);

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
export const getLegislatorSponsorshipPolicyAreaBreakdown = async (
  bioguideId: string
) => {
  const [sponsored, cosponsored] = await Promise.all([
    prisma.legislationSponsor.findMany({
      where: { sponsorBioguideId: bioguideId },
      select: { legislationId: true },
    }),
    prisma.legislationCosponsor.findMany({
      where: { cosponsorBioguideId: bioguideId },
      select: { legislationId: true },
    }),
  ]);

  const sponsoredIds = sponsored.map((s) => s.legislationId);
  const cosponsoredIds = cosponsored.map((c) => c.legislationId);
  const allIds = [...new Set([...sponsoredIds, ...cosponsoredIds])];

  if (allIds.length === 0) return { breakdown: [], bills: [] };

  const legislations = await prisma.legislation.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name_id: true, title: true, policy_area_id: true },
  });

  const policyAreaIds = [
    ...new Set(
      legislations
        .map((l) => l.policy_area_id)
        .filter((id): id is number => id !== null)
    ),
  ];

  const policyAreas =
    policyAreaIds.length > 0
      ? await prisma.policyArea.findMany({
        where: { id: { in: policyAreaIds } },
        select: { id: true, name: true },
      })
      : [];

  const policyNameById = Object.fromEntries(
    policyAreas.map((pa) => [pa.id, pa.name ?? "Uncategorized"])
  );

  const policyByLegislationId = Object.fromEntries(
    legislations.map((l) => [
      l.id,
      l.policy_area_id
        ? (policyNameById[l.policy_area_id] ?? "Uncategorized")
        : "Uncategorized",
    ])
  );

  const sponsoredIdSet = new Set(sponsoredIds);
  const cosponsoredIdSet = new Set(cosponsoredIds);

  type BreakdownMap = {
    policyArea: string;
    sponsored: number;
    cosponsored: number;
    combined: number;
  };

  const breakdownMap: { [key: string]: BreakdownMap } = {};

  for (const id of allIds) {
    const area = (policyByLegislationId[id] ?? "Uncategorized") as string;
    if (!breakdownMap[area]) {
      breakdownMap[area] = { policyArea: area, sponsored: 0, cosponsored: 0, combined: 0 };
    }
    if (sponsoredIdSet.has(id)) breakdownMap[area].sponsored += 1;
    if (cosponsoredIdSet.has(id)) breakdownMap[area].cosponsored += 1;
    breakdownMap[area].combined += 1;
  }

  // Build bill list — a bill can appear as both sponsored and cosponsored
  const bills = legislations.flatMap((l) => {
    const policyArea = (policyByLegislationId[l.id] ?? "Uncategorized") as string;
    const entries: {
      nameId: string;
      title: string;
      policyArea: string;
      sponsorType: "sponsored" | "cosponsored";
    }[] = [];

    if (!l.name_id) return entries;

    if (sponsoredIdSet.has(l.id)) {
      entries.push({
        nameId: l.name_id,
        title: l.title ?? l.name_id,
        policyArea,
        sponsorType: "sponsored",
      });
    }
    if (cosponsoredIdSet.has(l.id)) {
      entries.push({
        nameId: l.name_id,
        title: l.title ?? l.name_id,
        policyArea,
        sponsorType: "cosponsored",
      });
    }

    return entries;
  });

  return {
    breakdown: Object.values(breakdownMap).sort((a, b) => b.combined - a.combined),
    bills,
  };
};
