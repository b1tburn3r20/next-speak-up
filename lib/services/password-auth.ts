import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/prisma/client";

// NextAuth's Credentials provider always writes a JWT cookie, which can't work with database
// sessions. These helpers create a real session row and set NextAuth's own cookie instead, so
// getServerSession, the session callback, and signOut all work unchanged.

const BCRYPT_COST = 12;
const SESSION_DAYS = 30; // NextAuth's default session length
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything longer

// Compared against when no account matches, so a login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync("no-account-has-this-password", BCRYPT_COST);

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(191),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES, {
      message: "Password is too long",
    }),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(191),
  password: z.string().min(1).max(1000),
});

export type SignupInput = z.infer<typeof signupSchema>;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function sessionCookieName(): string {
  return usesSecureCookies()
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export function usesSecureCookies(): boolean {
  return (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
}

export function isAllowedOrigin(origin: string | null): boolean {
  const configured = process.env.NEXTAUTH_URL;
  if (!origin || !configured) return false;
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { sessionToken: randomUUID(), userId, expires },
    select: { sessionToken: true, expires: true },
  });
  return session;
}

export type SessionCookie = {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    path: "/";
    secure: boolean;
    expires: Date;
  };
};

export function sessionCookie(token: string, expires: Date): SessionCookie {
  return {
    name: sessionCookieName(),
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: usesSecureCookies(),
      expires,
    },
  };
}

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function signUp(input: SignupInput): Promise<SignupResult> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        name: input.username,
        password: { create: { passwordHash } },
      },
      select: { id: true },
    });
    return { ok: true, userId: user.id };
  } catch (error) {
    // P2002 is a unique constraint: the username or email is already in use.
    if ((error as { code?: string })?.code === "P2002") {
      return { ok: false, error: "That username or email isn't available." };
    }
    throw error;
  }
}

/** Returns the user's id, or null. Callers can't tell why a login failed, by design. */
export async function verifyLogin(
  identifier: string,
  password: string,
): Promise<string | null> {
  const value = identifier.trim();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: value }, { email: value.toLowerCase() }] },
    select: { id: true, password: { select: { passwordHash: true } } },
  });
  const hash = user?.password?.passwordHash;
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return matches && hash && user ? user.id : null;
}
