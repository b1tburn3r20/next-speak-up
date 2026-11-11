import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isPushEndpoint } from "@/lib/notifications/endpoint";
import { removeSubscription, saveSubscription } from "@/lib/notifications/subscriptions";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const saveSchema = z.object({
  endpoint: z.string().max(700).refine(isPushEndpoint, "Not a browser push service."),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});
const removeSchema = z.object({ endpoint: z.string().max(700).nullable().optional(), id: z.number().int().positive().optional() });

async function signedIn() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Sign in to get notifications." }, { status: 401 }) };
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return { error: NextResponse.json({ error: "Too many requests." }, { status: 429 }) };
  return { userId: session.user.id as string };
}

/** Saves this browser, so notifications reach it. */
export async function POST(request: NextRequest) {
  const auth = await signedIn();
  if ("error" in auth) return auth.error;
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  await saveSubscription(auth.userId, { endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent });
  return NextResponse.json({ saved: true });
}

/** Stops notifications to one of their browsers, by address or id, or to all of them when neither is given. */
export async function DELETE(request: NextRequest) {
  const auth = await signedIn();
  if ("error" in auth) return auth.error;
  const parsed = removeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await removeSubscription(auth.userId, { endpoint: parsed.data.endpoint, id: parsed.data.id });
  return NextResponse.json({ removed: true });
}
