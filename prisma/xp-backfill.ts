// Gives existing votes their XP. Used by the migration's SQL and the seed, and safe to re-run.
import type { PrismaClient } from "@prisma/client";

export const XP_BACKFILL_SQL = [
  `INSERT IGNORE INTO xp_event (userId, kind, amount, refKey, createdAt)
   SELECT v.userId, 'VOTE', 10, CAST(v.billId AS CHAR), v.createdAt FROM user_bill_vote v`,
  `INSERT IGNORE INTO xp_event (userId, kind, amount, refKey, createdAt)
   SELECT v.userId, 'AHEAD_OF_VOTE', 5, CAST(v.billId AS CHAR), v.createdAt FROM user_bill_vote v
   WHERE EXISTS (SELECT 1 FROM floor_schedule_item f WHERE f.billId = v.billId)`,
  // A fixed Eastern offset. Old daily goals can be an hour off around a clock change, which is harmless.
  `INSERT IGNORE INTO xp_event (userId, kind, amount, refKey, createdAt)
   SELECT v.userId, 'DAILY_GOAL', 20, DATE_FORMAT(DATE_SUB(v.createdAt, INTERVAL 5 HOUR), '%Y-%m-%d'), MAX(v.createdAt)
   FROM user_bill_vote v
   GROUP BY v.userId, DATE_FORMAT(DATE_SUB(v.createdAt, INTERVAL 5 HOUR), '%Y-%m-%d')
   HAVING COUNT(*) >= 3`,
];

export async function backfillXp(prisma: PrismaClient) {
  for (const statement of XP_BACKFILL_SQL) await prisma.$executeRawUnsafe(statement);
}
