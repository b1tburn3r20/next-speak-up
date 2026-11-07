// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  // Undefined models are what a server running an old database client sees.
  xpEvent: undefined as unknown,
  userBillVote: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
}));
vi.mock("@/prisma/client", () => ({ default: prismaMock }));

import { getHudProgressSafe } from "@/lib/civic/xp";

describe("getHudProgressSafe", () => {
  afterEach(() => vi.restoreAllMocks());

  it("hides the bar instead of breaking the page when the XP query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(getHudProgressSafe("u1")).resolves.toBeNull();
    expect(log).toHaveBeenCalledOnce();
  });

  it("returns progress when it works", async () => {
    prismaMock.xpEvent = { aggregate: vi.fn(async () => ({ _sum: { amount: 135 } })) };
    await expect(getHudProgressSafe("u1")).resolves.toMatchObject({ xp: 135, level: 2 });
    prismaMock.xpEvent = undefined;
  });
});
