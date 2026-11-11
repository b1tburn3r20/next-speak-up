// The notification sender. Each pass reads what's coming up and what just happened, works out with plan.ts
// what's due, and sends it. A pass is safe to run as often as anyone likes: every notification is written
// to notification_delivery first, under a unique key, and only the pass that wrote it sends it.
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { localDay, nextScheduledMeeting } from "@/lib/civic/city-logic";
import { easternToday, mondayOf, NEXT_MEETING, PENDING } from "@/lib/civic/floor-logic";
import { billLabel } from "@/lib/civic/labels";
import { stateByRegion, stateOfJurisdiction } from "@/lib/civic/states";
import { stateTimeZone } from "@/lib/civic/us-states";
import { billPath, cityMeetingPath, routes, stateRoutes } from "@/lib/routes";
import {
  becameLawMessage,
  dueReminders,
  floorBillsFor,
  floorWeekDue,
  floorWeekMessage,
  meetingMessage,
  MUTED_TOPIC_PREFIX,
  mutedTopicsFrom,
  NOTIFY_PREFS,
  notifyTopics,
  prefsFrom,
  wantsVoteResult,
  type NotifyChoices,
  theirLegislators,
  voteResultMessage,
  type CastVote,
  type FloorBill,
  type Message,
  type NotifyPref,
  type Position,
  type UpcomingMeeting,
} from "./plan";
import { pushPayload, pushTransport } from "./web-push";

const DAY_MS = 24 * 60 * 60 * 1000;
// A vote or a new law older than this isn't news, so a pipeline catching up on old votes stays quiet.
const NEWS_WINDOW_MS = 3 * DAY_MS;
// A subscription that fails this many times in a row, without the push service saying it's gone, is dropped.
const MAX_FAILURES = 5;

type Kind = "CITY_MEETING" | "FLOOR_WEEK" | "VOTE_RESULT" | "BECAME_LAW" | "TEST";
export type DeliveryOutcome = "sent" | "unreached" | "duplicate";
export type DispatchCounts = Record<"cityMeetings" | "floorWeek" | "voteResults" | "becameLaw", number> & { duplicates: number; unreached: number };

/**
 * Sends one notification to every browser someone has, unless it already went out. Returns "sent" when
 * at least one browser took it, and "unreached" when none did.
 */
export async function deliver(userId: string, kind: Kind, refKey: string, message: Message): Promise<DeliveryOutcome> {
  let deliveryId: number;
  try {
    const row = await prisma.notificationDelivery.create({
      data: { userId, kind, refKey, title: message.title.slice(0, 200), body: message.body.slice(0, 500), url: message.url.slice(0, 500) },
      select: { id: true },
    });
    deliveryId = row.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "duplicate";
    throw error;
  }
  const targets = await prisma.pushSubscription.findMany({ where: { userId }, select: { id: true, endpoint: true, p256dh: true, auth: true, failures: true } });
  const payload = pushPayload(message, `${kind}:${refKey}`);
  let reached = 0;
  for (const target of targets) {
    const result = await pushTransport()(target, payload);
    if (result.ok) {
      reached += 1;
      await prisma.pushSubscription.update({ where: { id: target.id }, data: { lastSuccessAt: new Date(), failures: 0 } });
    } else if (("gone" in result && result.gone) || target.failures + 1 >= MAX_FAILURES) {
      await prisma.pushSubscription.deleteMany({ where: { id: target.id } });
    } else {
      await prisma.pushSubscription.update({ where: { id: target.id }, data: { failures: { increment: 1 } } });
    }
  }
  await prisma.notificationDelivery.update({ where: { id: deliveryId }, data: { reached } });
  return reached > 0 ? "sent" : "unreached";
}

/** Everyone with at least one browser signed up, and which kinds they want. */
export type People = Map<string, NotifyChoices>;

async function subscribers(): Promise<People> {
  const rows = await prisma.pushSubscription.findMany({ distinct: ["userId"], select: { userId: true } });
  const ids = rows.map((row) => row.userId);
  if (ids.length === 0) return new Map();
  const prefs = await prisma.userPreference.findMany({
    where: { userId: { in: ids }, OR: [{ key: { in: Object.values(NOTIFY_PREFS) } }, { key: { startsWith: MUTED_TOPIC_PREFIX } }] },
    select: { userId: true, key: true, value: true },
  });
  return new Map(
    ids.map((id) => {
      const own = prefs.filter((pref) => pref.userId === id);
      return [id, { prefs: prefsFrom(own), mutedTopics: mutedTopicsFrom(own) }];
    }),
  );
}

function wanting(people: People, ...names: NotifyPref[]): string[] {
  return [...people].filter(([, choices]) => names.some((name) => choices.prefs[name])).map(([id]) => id);
}

// ---------------------------------------------------------------------------------------------------

/** Reminders for council meetings in each person's home city: a week, two days, and a day ahead, and the day of. */
export async function sendMeetingReminders(userIds: string[], now: Date): Promise<DeliveryOutcome[]> {
  if (userIds.length === 0) return [];
  const homes = await prisma.userLocation.findMany({
    where: { userId: { in: userIds }, placeGeoid: { not: null } },
    select: { userId: true, placeGeoid: true },
  });
  const byCity = new Map<string, Set<string>>();
  for (const home of homes) {
    const geoid = home.placeGeoid as string;
    byCity.set(geoid, (byCity.get(geoid) ?? new Set()).add(home.userId));
  }
  const outcomes: DeliveryOutcome[] = [];
  for (const [geoid, people] of byCity) {
    const profile = await prisma.cityProfile.findUnique({
      where: { placeGeoid: geoid },
      select: { jurisdictionId: true, slug: true, name: true, regionCode: true, meetingSchedule: true, speakUrl: true, phone: true },
    });
    const state = stateByRegion(profile?.regionCode);
    if (!profile || !state) continue;
    const config = state.cities.find((city) => city.placeGeoid === geoid) ?? null;
    const cityKey = config?.key ?? profile.slug;
    const events = await prisma.civicEvent.findMany({
      where: {
        jurisdictionId: profile.jurisdictionId,
        status: "SCHEDULED",
        startsAt: { gte: new Date(now.getTime() - DAY_MS), lte: new Date(now.getTime() + 8 * DAY_MS) },
        // A city with its own settings posts committee meetings too. Only its regular council meetings remind.
        ...(config ? { title: { contains: "Regular" } } : {}),
      },
      select: { id: true, title: true, startsAt: true, hasTime: true },
      orderBy: { startsAt: "asc" },
    });
    const meetings: { meeting: UpcomingMeeting; title: string | null; url: string }[] = events.map((event) => ({
      meeting: {
        ref: `event:${event.id}`,
        day: event.hasTime ? localDay(event.startsAt, state.timeZone) : new Date(Date.UTC(event.startsAt.getUTCFullYear(), event.startsAt.getUTCMonth(), event.startsAt.getUTCDate())),
        startsAt: event.hasTime ? event.startsAt : null,
        fromSchedule: false,
      },
      title: event.title,
      url: cityMeetingPath(state.key, cityKey, event.id),
    }));
    if (meetings.length === 0) {
      // No agendas online: the council's stated schedule still says when it meets.
      const scheduled = nextScheduledMeeting(profile.meetingSchedule, state.timeZone, now);
      if (scheduled) {
        meetings.push({
          meeting: { ref: `sched:${geoid}:${scheduled.day.toISOString().slice(0, 10)}`, day: scheduled.day, startsAt: scheduled.startsAt, fromSchedule: true },
          title: null,
          url: stateRoutes(state.key).city(cityKey),
        });
      }
    }
    for (const { meeting, title, url } of meetings) {
      for (const slot of dueReminders(meeting, now, state.timeZone)) {
        const message = meetingMessage({ cityName: profile.name, meeting, slot, title, url, speakUrl: profile.speakUrl, phone: profile.phone }, state.timeZone);
        for (const userId of people) outcomes.push(await deliver(userId, "CITY_MEETING", `${meeting.ref}:${slot}`, message));
      }
    }
  }
  return outcomes;
}

const FLOOR_BILL_SELECT = {
  billId: true,
  bill: { select: { slug: true, billType: true, number: true, title: true, policyArea: true } },
  chamber: { select: { kind: true } },
} satisfies Prisma.FloorScheduleItemSelect;

/** This week's House and Senate schedules: the House's list, and the Senate's dated orders. */
async function floorBillsThisWeek(now: Date): Promise<FloorBill[]> {
  const weekOf = mondayOf(easternToday(now));
  const rows = await prisma.floorScheduleItem.findMany({
    where: {
      weekOf,
      removedAt: null,
      billId: { not: null },
      chamber: { jurisdiction: { code: "US" } },
      category: { notIn: [NEXT_MEETING, PENDING] },
    },
    select: FLOOR_BILL_SELECT,
  });
  return rows.flatMap((row) =>
    row.bill && row.billId
      ? [
          {
            billId: row.billId,
            slug: row.bill.slug,
            label: billLabel(row.bill.billType, row.bill.number),
            title: row.bill.title,
            policyArea: row.bill.policyArea,
            chamber: row.chamber.kind,
          },
        ]
      : [],
  );
}

/** Monday's note: bills in someone's topics that may come up for a vote this week. */
export async function sendFloorWeek(userIds: string[], now: Date, people: People = new Map()): Promise<DeliveryOutcome[]> {
  if (userIds.length === 0) return [];
  const [bills, topics, places] = await Promise.all([
    floorBillsThisWeek(now),
    prisma.userPolicyTopic.findMany({ where: { userId: { in: userIds } }, select: { userId: true, policyArea: true } }),
    prisma.userLocation.findMany({ where: { userId: { in: userIds }, jurisdiction: { code: "US" } }, select: { userId: true, regionCode: true } }),
  ]);
  if (bills.length === 0) return [];
  const outcomes: DeliveryOutcome[] = [];
  for (const userId of userIds) {
    const week = floorWeekDue(now, stateTimeZone(places.find((place) => place.userId === userId)?.regionCode));
    if (!week) continue;
    const tracked = topics.filter((topic) => topic.userId === userId).map((topic) => topic.policyArea);
    const mine = floorBillsFor(bills, notifyTopics(tracked, people.get(userId)?.mutedTopics ?? []));
    const message = floorWeekMessage(mine, routes.federal.upcoming);
    if (message) outcomes.push(await deliver(userId, "FLOOR_WEEK", `floor:${week}`, message));
  }
  return outcomes;
}

/**
 * How each new final vote turned out, with how the person's own legislators voted. Goes to people who
 * follow the bill, voted on it, or were told it might come up because it's in their topics.
 */
export async function sendVoteResults(userIds: string[], now: Date, people: People = new Map()): Promise<DeliveryOutcome[]> {
  if (userIds.length === 0) return [];
  const wanted = new Set(userIds);
  const rollCalls = await prisma.rollCall.findMany({
    where: { isFinalVote: true, billId: { not: null }, occurredAt: { gte: new Date(now.getTime() - NEWS_WINDOW_MS), lte: now } },
    select: {
      id: true,
      billId: true,
      jurisdictionId: true,
      chamberId: true,
      result: true,
      totalYea: true,
      totalNay: true,
      jurisdiction: { select: { code: true } },
      chamber: { select: { kind: true, shortName: true } },
      bill: { select: { slug: true, billType: true, number: true, policyArea: true } },
    },
  });
  const outcomes: DeliveryOutcome[] = [];
  for (const rollCall of rollCalls) {
    const bill = rollCall.bill;
    const billId = rollCall.billId as number;
    if (!bill) continue;
    const [followers, voters, scheduled] = await Promise.all([
      prisma.userBillFollow.findMany({ where: { billId, following: true, userId: { in: userIds } }, select: { userId: true } }),
      prisma.userBillVote.findMany({ where: { billId, userId: { in: userIds } }, select: { userId: true, position: true } }),
      prisma.floorScheduleItem.count({ where: { billId, weekOf: { gte: new Date(now.getTime() - 14 * DAY_MS) } } }),
    ]);
    const topical =
      scheduled > 0 && bill.policyArea
        ? await prisma.userPolicyTopic.findMany({ where: { policyArea: bill.policyArea, userId: { in: userIds } }, select: { userId: true } })
        : [];
    const following = new Set(followers.map((row) => row.userId));
    const voted = new Set(voters.map((row) => row.userId));
    const inTopic = new Set(topical.map((row) => row.userId));
    // Each reason someone would get this counts only if they kept that kind of result on.
    const recipients = [...new Set([...following, ...voted, ...inTopic])].filter((id) => {
      if (!wanted.has(id)) return false;
      const choices = people.get(id) ?? { prefs: prefsFrom([]), mutedTopics: [] };
      return wantsVoteResult(choices, { follows: following.has(id), voted: voted.has(id), scheduledInTopic: inTopic.has(id), policyArea: bill.policyArea });
    });
    if (recipients.length === 0) continue;
    const federal = rollCall.jurisdiction.code === "US";
    const [positions, places] = await Promise.all([
      prisma.rollCallPosition.findMany({
        where: { rollCallId: rollCall.id },
        select: {
          personId: true,
          position: true,
          regionCode: true,
          person: {
            select: {
              fullName: true,
              terms: { where: { chamberId: rollCall.chamberId }, orderBy: { startYear: "desc" }, take: 1, select: { districtId: true, regionCode: true } },
            },
          },
        },
      }),
      prisma.userLocation.findMany({
        where: { userId: { in: recipients }, jurisdictionId: rollCall.jurisdictionId },
        select: { userId: true, regionCode: true, districtId: true, upperDistrictId: true },
      }),
    ]);
    const votes: CastVote[] = positions.map((row) => ({
      personId: row.personId,
      name: row.person.fullName,
      position: row.position as Position,
      districtId: row.person.terms[0]?.districtId ?? null,
      regionCode: row.regionCode ?? row.person.terms[0]?.regionCode ?? "",
    }));
    const state = federal ? null : stateOfJurisdiction(rollCall.jurisdiction.code);
    const chamberName = federal ? `The ${rollCall.chamber.shortName}` : `The ${state?.name ?? ""} ${rollCall.chamber.shortName}`.replace(/\s+/g, " ");
    for (const userId of recipients) {
      const place = places.find((row) => row.userId === userId) ?? null;
      const message = voteResultMessage({
        chamberName,
        label: billLabel(bill.billType, bill.number),
        result: rollCall.result,
        yea: rollCall.totalYea,
        nay: rollCall.totalNay,
        legislators: theirLegislators(votes, place, rollCall.chamber.kind, federal),
        mine: (voters.find((row) => row.userId === userId)?.position as Position | undefined) ?? null,
        url: billPath(bill.slug),
      });
      outcomes.push(await deliver(userId, "VOTE_RESULT", `rollcall:${rollCall.id}`, message));
    }
  }
  return outcomes;
}

/** A followed bill became law. */
export async function sendBecameLaw(userIds: string[], now: Date): Promise<DeliveryOutcome[]> {
  if (userIds.length === 0) return [];
  const since = new Date(now.getTime() - NEWS_WINDOW_MS);
  const follows = await prisma.userBillFollow.findMany({
    where: {
      following: true,
      userId: { in: userIds },
      bill: { currentStatus: { in: ["SIGNED", "BECAME_LAW", "VETO_OVERRIDDEN"] }, statusDate: { gte: new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate())) } },
    },
    select: { userId: true, billId: true, bill: { select: { slug: true, billType: true, number: true, title: true } } },
  });
  const outcomes: DeliveryOutcome[] = [];
  for (const follow of follows) {
    const message = becameLawMessage({ label: billLabel(follow.bill.billType, follow.bill.number), title: follow.bill.title, url: billPath(follow.bill.slug) });
    outcomes.push(await deliver(follow.userId, "BECAME_LAW", `law:${follow.billId}`, message));
  }
  return outcomes;
}

/** One pass over everything. Called every ten minutes on the server, and by /api/cron/notify. */
export async function runDispatch(now = new Date()): Promise<DispatchCounts> {
  const people = await subscribers();
  const [meetings, floor, votes, laws] = [
    await sendMeetingReminders(wanting(people, "cityMeetings"), now),
    await sendFloorWeek(wanting(people, "floorWeek"), now, people),
    await sendVoteResults(wanting(people, "voteResults", "votedBills", "topicResults"), now, people),
    await sendBecameLaw(wanting(people, "becameLaw"), now),
  ];
  const all = [...meetings, ...floor, ...votes, ...laws];
  const sent = (list: DeliveryOutcome[]) => list.filter((outcome) => outcome === "sent").length;
  return {
    cityMeetings: sent(meetings),
    floorWeek: sent(floor),
    voteResults: sent(votes),
    becameLaw: sent(laws),
    duplicates: all.filter((outcome) => outcome === "duplicate").length,
    unreached: all.filter((outcome) => outcome === "unreached").length,
  };
}
