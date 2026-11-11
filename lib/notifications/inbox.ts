// The bell's list: what was sent to someone, newest first. Reading it marks it read.
import prisma from "@/prisma/client";

export type InboxItem = { id: number; title: string; body: string; url: string; sentAt: string; read: boolean };
export type InboxView = { items: InboxItem[]; unread: number };

const SHOWN = 10;

export async function getInbox(userId: string): Promise<InboxView> {
  const [rows, unread] = await Promise.all([
    prisma.notificationDelivery.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: SHOWN,
      select: { id: true, title: true, body: true, url: true, sentAt: true, readAt: true },
    }),
    prisma.notificationDelivery.count({ where: { userId, readAt: null } }),
  ]);
  return {
    items: rows.map((row) => ({ id: row.id, title: row.title, body: row.body, url: row.url, sentAt: row.sentAt.toISOString(), read: row.readAt !== null })),
    unread,
  };
}

/** Everything sent so far counts as seen once the bell is opened. */
export async function markInboxRead(userId: string, now = new Date()): Promise<void> {
  await prisma.notificationDelivery.updateMany({ where: { userId, readAt: null }, data: { readAt: now } });
}
