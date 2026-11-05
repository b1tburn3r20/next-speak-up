import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimiter";
import {
  createSession,
  isAllowedOrigin,
  sessionCookie,
  signUp,
  signupSchema,
} from "@/lib/services/password-auth";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("general", "unauthenticated", `signup:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again soon." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 },
    );
  }

  const result = await signUp(parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const session = await createSession(result.userId);
  const response = NextResponse.json({ ok: true }, { status: 201 });
  const cookie = sessionCookie(session.sessionToken, session.expires);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
