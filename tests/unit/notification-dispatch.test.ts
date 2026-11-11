// @vitest-environment node
// The sender, with the database and push services stubbed. Nothing here reaches a real browser.
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  notificationDelivery: { create: vi.fn(), update: vi.fn() },
  pushSubscription: { findMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("@/prisma/client", () => ({ default: db }));

import { Prisma } from "@prisma/client";
import { deliver } from "@/lib/notifications/dispatch";
import { setPushTransport } from "@/lib/notifications/web-push";

const MESSAGE = { title: "Pella City Council meets tomorrow", body: "Regular meeting.", url: "/state/ia/city/pella" };
const SUBS = [
  { id: 1, endpoint: "https://fcm.googleapis.com/fcm/send/a", p256dh: "k", auth: "a", failures: 0 },
  { id: 2, endpoint: "https://fcm.googleapis.com/fcm/send/b", p256dh: "k", auth: "a", failures: 4 },
];

beforeEach(() => {
  vi.clearAllMocks();
  db.notificationDelivery.create.mockResolvedValue({ id: 10 });
  db.pushSubscription.findMany.mockResolvedValue(SUBS);
});

describe("sending one notification", () => {
  it("claims it first, sends to every browser, and counts the ones it reached", async () => {
    const sent: string[] = [];
    setPushTransport(async (target, payload) => {
      sent.push(target.endpoint);
      expect(JSON.parse(payload)).toMatchObject({ title: MESSAGE.title, url: MESSAGE.url, tag: "CITY_MEETING:event:1:1d" });
      return { ok: true };
    });
    expect(await deliver("u1", "CITY_MEETING", "event:1:1d", MESSAGE)).toBe("sent");
    expect(sent).toHaveLength(2);
    expect(db.notificationDelivery.update).toHaveBeenCalledWith({ where: { id: 10 }, data: { reached: 2 } });
  });

  it("never sends twice: a second claim on the same key sends nothing", async () => {
    const transport = vi.fn();
    setPushTransport(transport);
    db.notificationDelivery.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
    expect(await deliver("u1", "CITY_MEETING", "event:1:1d", MESSAGE)).toBe("duplicate");
    expect(transport).not.toHaveBeenCalled();
  });

  it("drops a browser the push service says is gone, and one that keeps failing", async () => {
    setPushTransport(async (target) => (target.endpoint === SUBS[0].endpoint ? { ok: false, gone: true, status: 410 } : { ok: false, gone: false, status: 500 }));
    expect(await deliver("u1", "VOTE_RESULT", "rollcall:5", MESSAGE)).toBe("unreached");
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: 1 } });
    // The second had failed four times already, so a fifth removes it.
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it("counts a failure without dropping a browser that has failed less", async () => {
    db.pushSubscription.findMany.mockResolvedValue([SUBS[0]]);
    setPushTransport(async () => ({ ok: false, gone: false, status: 500 }));
    await deliver("u1", "VOTE_RESULT", "rollcall:6", MESSAGE);
    expect(db.pushSubscription.deleteMany).not.toHaveBeenCalled();
    expect(db.pushSubscription.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { failures: { increment: 1 } } });
  });
});
