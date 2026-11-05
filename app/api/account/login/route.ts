import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimiter";
import {
  createSession,
  isAllowedOrigin,
  loginSchema,
  sessionCookie,
  verifyLogin,
} from "@/lib/services/password-auth";

const INVALID = "Incorrect username, email, or password.";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("general", "unauthenticated", `login:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again soon." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }

  const userId = await verifyLogin(parsed.data.identifier, parsed.data.password);
  if (!userId) {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }

  const session = await createSession(userId);
  const response = NextResponse.json({ ok: true });
  const cookie = sessionCookie(session.sessionToken, session.expires);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
