import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deliver } from "@/lib/notifications/dispatch";
import { pushConfigured } from "@/lib/notifications/web-push";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";
import { routes } from "@/lib/routes";

/** Sends one notification to someone's own browsers, to show it works. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications aren't set up on this server yet." }, { status: 503 });
  const outcome = await deliver(session.user.id, "TEST", `test:${Date.now()}`, {
    title: "Notifications are on",
    body: "This is what a meeting reminder or a vote result will look like.",
    url: routes.settings,
  });
  return NextResponse.json({ reached: outcome === "sent" });
}
