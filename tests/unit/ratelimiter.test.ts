// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// Any call to Upstash would fail these tests. No test may reach it.
const fromEnv = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("Upstash must not be reached in tests");
  }),
);
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv } }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(vi.fn(), { slidingWindow: vi.fn() }),
}));

import {
  checkRateLimit,
  getUserRole,
  isRateLimitingDisabled,
} from "@/lib/ratelimiter";

describe("rate limit switch", () => {
  it("importing the module doesn't touch Upstash", () => {
    expect(fromEnv).not.toHaveBeenCalled();
  });

  it("allows every request while disabled, without touching Upstash", async () => {
    vi.stubEnv("RATE_LIMITING_DISABLED", "true");
    expect(await checkRateLimit("chatbot", "unauthenticated", "x")).toEqual({ success: true });
    expect(fromEnv).not.toHaveBeenCalled();
  });

  it("stays on when the flag is unset, so deployments stay protected", () => {
    vi.stubEnv("RATE_LIMITING_DISABLED", "");
    expect(isRateLimitingDisabled()).toBe(false);
  });

  it.each(["false", "1", "TRUE", "yes"])("treats %s as still on", (value) => {
    vi.stubEnv("RATE_LIMITING_DISABLED", value);
    expect(isRateLimitingDisabled()).toBe(false);
  });
});

describe("getUserRole", () => {
  it("treats signed-out visitors as unauthenticated", () => {
    expect(getUserRole(null)).toBe("unauthenticated");
  });

  it("uses the role on the session", () => {
    expect(getUserRole({ user: { id: "1", role: { name: "Admin" } } })).toBe("Admin");
  });

  it("falls back to Member for an unknown role", () => {
    expect(getUserRole({ user: { id: "1", role: { name: "Other" } } })).toBe("Member");
  });
});
