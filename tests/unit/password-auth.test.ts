// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { create: vi.fn(), findFirst: vi.fn() },
  session: { create: vi.fn() },
}));
vi.mock("@/prisma/client", () => ({ default: prismaMock }));

import {
  hashPassword,
  isAllowedOrigin,
  loginSchema,
  sessionCookie,
  sessionCookieName,
  signUp,
  signupSchema,
  verifyLogin,
} from "@/lib/services/password-auth";

const valid = { username: "jane_doe", email: "Jane@Example.com", password: "long enough" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signupSchema", () => {
  it("accepts valid details and normalizes the email", () => {
    const result = signupSchema.parse(valid);
    expect(result.email).toBe("jane@example.com");
  });

  it.each([
    ["short username", { ...valid, username: "ab" }],
    ["username with spaces", { ...valid, username: "jane doe" }],
    ["username with symbols", { ...valid, username: "jane<script>" }],
    ["bad email", { ...valid, email: "nope" }],
    ["short password", { ...valid, password: "short" }],
    ["password over bcrypt's limit", { ...valid, password: "x".repeat(73) }],
    ["multi-byte password over the limit", { ...valid, password: "é".repeat(37) }],
  ])("rejects %s", (_label, input) => {
    expect(signupSchema.safeParse(input).success).toBe(false);
  });

  it("accepts a password at exactly 72 bytes", () => {
    expect(signupSchema.safeParse({ ...valid, password: "x".repeat(72) }).success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "a" }).success).toBe(false);
  });
});

describe("isAllowedOrigin", () => {
  it("allows only the configured origin", () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3001")).toBe(false);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
  });

  it("rejects missing or malformed origins", () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect(isAllowedOrigin(null)).toBe(false);
    expect(isAllowedOrigin("not a url")).toBe(false);
  });

  it("fails closed when NEXTAUTH_URL is unset", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    expect(isAllowedOrigin("http://localhost:3000")).toBe(false);
  });
});

describe("session cookie", () => {
  it("uses NextAuth's plain cookie name over HTTP", () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    expect(sessionCookieName()).toBe("next-auth.session-token");
    expect(sessionCookie("t", new Date()).options.secure).toBe(false);
  });

  it("uses NextAuth's secure cookie name and flag over HTTPS", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://coolbills.example");
    expect(sessionCookieName()).toBe("__Secure-next-auth.session-token");
    expect(sessionCookie("t", new Date()).options.secure).toBe(true);
  });

  it("can't be read by page scripts", () => {
    const cookie = sessionCookie("t", new Date());
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.sameSite).toBe("lax");
  });
});

describe("signUp", () => {
  const input = { username: "jane", email: "jane@example.com", password: "long enough" };

  it("stores a hash rather than the password", async () => {
    prismaMock.user.create.mockResolvedValue({ id: "u1" });
    expect(await signUp(input)).toEqual({ ok: true, userId: "u1" });
    const stored = prismaMock.user.create.mock.calls[0][0].data.password.create.passwordHash;
    expect(stored).not.toContain("long enough");
    expect(stored).toMatch(/^\$2[aby]\$12\$/);
  });

  it("gives one message whether the username or the email is taken", async () => {
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });
    expect(await signUp(input)).toEqual({
      ok: false,
      error: "That username or email isn't available.",
    });
  });

  it("doesn't hide unexpected database errors", async () => {
    prismaMock.user.create.mockRejectedValue(new Error("connection lost"));
    await expect(signUp(input)).rejects.toThrow("connection lost");
  });
});

describe("verifyLogin", () => {
  it("accepts the right password and returns the user's id", async () => {
    const passwordHash = await hashPassword("right password");
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1", password: { passwordHash } });
    expect(await verifyLogin("jane", "right password")).toBe("u1");
  });

  it("rejects the wrong password", async () => {
    const passwordHash = await hashPassword("right password");
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1", password: { passwordHash } });
    expect(await verifyLogin("jane", "wrong password")).toBeNull();
  });

  it("rejects unknown users", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    expect(await verifyLogin("nobody", "anything")).toBeNull();
  });

  it("rejects Google-only accounts, which have no password", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1", password: null });
    expect(await verifyLogin("jane", "no-account-has-this-password")).toBeNull();
  });

  it("matches by username or lowercased email", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    await verifyLogin(" Jane@Example.COM ", "x");
    expect(prismaMock.user.findFirst.mock.calls[0][0].where.OR).toEqual([
      { username: "Jane@Example.COM" },
      { email: "jane@example.com" },
    ]);
  });
});
