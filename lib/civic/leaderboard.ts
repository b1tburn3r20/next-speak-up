// The weekly statewide board. It ranks activity only, and nothing here can show how anyone voted.
import prisma from "@/prisma/client";
import { weekStart } from "./engagement-logic";

export type LeaderboardRow = { userId: string; username: string; xp: number; rank: number };

export type Leaderboard = {
  regionCode: string;
  rows: LeaderboardRow[];
  myXp: number;
  /** Where you'd be, whether or not you've joined. */
  myRank: number;
  joined: boolean;
  hidden: boolean;
  hasUsername: boolean;
};

const LIMIT = 50;

export async function getLeaderboard(userId: string, regionCode: string, now = new Date()): Promise<Leaderboard> {
  const since = weekStart(now);
  const [rows, me, mine] = await Promise.all([
    prisma.$queryRaw<{ userId: string; username: string; xp: bigint | number }[]>`
      SELECT u.id AS userId, u.username AS username, SUM(x.amount) AS xp
      FROM xp_event x
      JOIN user u ON u.id = x.userId
      JOIN user_location l ON l.userId = u.id AND l.regionCode = ${regionCode}
      JOIN jurisdiction j ON j.id = l.jurisdictionId AND j.code = 'US'
      WHERE x.createdAt >= ${since}
        AND u.leaderboardOptIn = TRUE
        AND u.leaderboardHiddenAt IS NULL
        AND u.username IS NOT NULL
      GROUP BY u.id, u.username
      ORDER BY xp DESC, u.username ASC
      LIMIT ${LIMIT}`,
    prisma.user.findUnique({
      where: { id: userId },
      select: { leaderboardOptIn: true, leaderboardHiddenAt: true, username: true },
    }),
    prisma.xpEvent.aggregate({ where: { userId, createdAt: { gte: since } }, _sum: { amount: true } }),
  ]);
  const ranked = rows.map((row, index) => ({
    userId: row.userId,
    username: row.username,
    xp: Number(row.xp),
    rank: index + 1,
  }));
  const myXp = mine._sum.amount ?? 0;
  const ahead = ranked.filter((row) => row.userId !== userId && row.xp > myXp).length;
  return {
    regionCode,
    rows: ranked,
    myXp,
    myRank: ahead + 1,
    joined: Boolean(me?.leaderboardOptIn),
    hidden: Boolean(me?.leaderboardHiddenAt),
    hasUsername: Boolean(me?.username),
  };
}

export async function setLeaderboardOptIn(userId: string, optIn: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { leaderboardOptIn: optIn } });
}

export async function hideFromLeaderboard(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { leaderboardHiddenAt: new Date() } });
}
