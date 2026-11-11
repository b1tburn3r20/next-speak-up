// Saving and reading someone's push subscriptions and notification choices.
import prisma from "@/prisma/client";
import { billLabel } from "@/lib/civic/labels";
import { stateByRegion } from "@/lib/civic/states";
import { billPath, stateRoutes } from "@/lib/routes";
import { deviceLabel, MUTED_TOPIC_PREFIX, mutedTopicsFrom, NOTIFY_PREF_NAMES, NOTIFY_PREFS, prefsFrom, type NotifyPref } from "./plan";

export type NotifySettings = { devices: number; prefs: Record<NotifyPref, boolean>; mutedTopics: string[] };

/** Where someone's choices are: one row per kind, and one per muted topic. */
function choiceRows(userId: string) {
  return prisma.userPreference.findMany({
    where: { userId, OR: [{ key: { in: Object.values(NOTIFY_PREFS) } }, { key: { startsWith: MUTED_TOPIC_PREFIX } }] },
    select: { key: true, value: true },
  });
}

export async function getNotifySettings(userId: string): Promise<NotifySettings> {
  const [devices, rows] = await Promise.all([
    prisma.pushSubscription.count({ where: { userId } }),
    choiceRows(userId),
  ]);
  return { devices, prefs: prefsFrom(rows), mutedTopics: mutedTopicsFrom(rows) };
}

/** Everything someone gets notified about, for the manager in Settings. Only their own. */
export type NotifyManagerView = {
  prefs: Record<NotifyPref, boolean>;
  homeCity: { name: string; href: string } | null;
  topics: { name: string; muted: boolean }[];
  followed: { slug: string; label: string; title: string; href: string }[];
  votedCount: number;
  devices: { id: number; endpoint: string; label: string; addedAt: string; lastSuccessAt: string | null }[];
  recent: { id: number; title: string; url: string; sentAt: string; reached: number }[];
};

const FOLLOWED_SHOWN = 50;

export async function getNotifyManager(userId: string): Promise<NotifyManagerView> {
  const [rows, home, topics, followed, votedCount, devices, recent] = await Promise.all([
    choiceRows(userId),
    prisma.userLocation.findFirst({ where: { userId, placeGeoid: { not: null } }, orderBy: { updatedAt: "desc" }, select: { placeGeoid: true } }),
    prisma.userPolicyTopic.findMany({ where: { userId }, orderBy: { policyArea: "asc" }, select: { policyArea: true } }),
    prisma.userBillFollow.findMany({
      where: { userId, following: true },
      orderBy: { updatedAt: "desc" },
      take: FOLLOWED_SHOWN,
      select: { bill: { select: { slug: true, billType: true, number: true, title: true } } },
    }),
    prisma.userBillVote.count({ where: { userId } }),
    prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, endpoint: true, userAgent: true, createdAt: true, lastSuccessAt: true },
    }),
    prisma.notificationDelivery.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: 5,
      select: { id: true, title: true, url: true, sentAt: true, reached: true },
    }),
  ]);
  const muted = new Set(mutedTopicsFrom(rows));
  return {
    prefs: prefsFrom(rows),
    homeCity: home?.placeGeoid ? await homeCityOf(home.placeGeoid) : null,
    topics: topics.map((topic) => ({ name: topic.policyArea, muted: muted.has(topic.policyArea) })),
    followed: followed.map(({ bill }) => ({ slug: bill.slug, label: billLabel(bill.billType, bill.number), title: bill.title, href: billPath(bill.slug) })),
    votedCount,
    devices: devices.map((device) => ({
      id: device.id,
      endpoint: device.endpoint,
      label: deviceLabel(device.userAgent),
      addedAt: device.createdAt.toISOString(),
      lastSuccessAt: device.lastSuccessAt?.toISOString() ?? null,
    })),
    recent: recent.map((row) => ({ id: row.id, title: row.title, url: row.url, sentAt: row.sentAt.toISOString(), reached: row.reached })),
  };
}

async function homeCityOf(placeGeoid: string): Promise<NotifyManagerView["homeCity"]> {
  const profile = await prisma.cityProfile.findUnique({ where: { placeGeoid }, select: { name: true, slug: true, regionCode: true } });
  const state = stateByRegion(profile?.regionCode);
  if (!profile || !state) return null;
  const key = state.cities.find((city) => city.placeGeoid === placeGeoid)?.key ?? profile.slug;
  return { name: profile.name, href: stateRoutes(state.key).city(key) };
}

/** Saves a browser's subscription. A browser someone else used before moves to whoever is signed in now. */
export async function saveSubscription(userId: string, input: { endpoint: string; p256dh: string; auth: string; userAgent: string | null }) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: { userId, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent },
    update: { userId, p256dh: input.p256dh, auth: input.auth, userAgent: input.userAgent, failures: 0 },
  });
}

/** Removes one of someone's own browsers, by its address or its id, or all of them. Never anyone else's. */
export async function removeSubscription(userId: string, which: { endpoint?: string | null; id?: number | null } = {}) {
  await prisma.pushSubscription.deleteMany({
    where: { userId, ...(which.endpoint ? { endpoint: which.endpoint } : {}), ...(which.id ? { id: which.id } : {}) },
  });
}

export async function setNotifyPrefs(userId: string, changes: Partial<Record<NotifyPref, boolean>> & { topic?: { name: string; muted: boolean } }) {
  const entries = Object.entries(changes).filter(([name]) => (NOTIFY_PREF_NAMES as string[]).includes(name)) as [NotifyPref, boolean][];
  const writes = entries.map(([name, on]) => ({ key: NOTIFY_PREFS[name] as string, value: String(on) }));
  if (changes.topic) writes.push({ key: `${MUTED_TOPIC_PREFIX}${changes.topic.name}`, value: String(changes.topic.muted) });
  await prisma.$transaction(
    writes.map(({ key, value }) =>
      prisma.userPreference.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, value },
        update: { value },
      }),
    ),
  );
}
