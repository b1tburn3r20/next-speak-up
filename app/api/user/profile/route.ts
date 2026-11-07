import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/require-permission";
import { clearAbout, saveProfileSettings } from "@/lib/civic/profile";
import { ABOUT_MAX_LENGTH } from "@/lib/civic/profile-logic";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

// Strict, so an unknown field is refused rather than ignored.
const schema = z
  .object({
    about: z.string().max(ABOUT_MAX_LENGTH).nullable(),
    isPublic: z.boolean(),
    showName: z.boolean(),
    showAgeRange: z.boolean(),
    showState: z.boolean(),
    showDistrict: z.boolean(),
    showIncome: z.boolean(),
    showVotingTopics: z.boolean(),
  })
  .partial()
  .strict();

/** Someone's own profile choices. It only ever changes the signed-in person's. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = await checkRateLimit("general", getUserRole(session), session.user.id);
  if (!limit.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile settings." }, { status: 400 });
  const changes = parsed.data;
  if (typeof changes.about === "string") changes.about = changes.about.trim() || null;
  await saveProfileSettings(session.user.id, changes);
  return NextResponse.json({ ok: true });
}

const clearSchema = z.object({ userId: z.string().min(1).max(40) });

/** A moderator removes someone's about me. */
export async function DELETE(request: NextRequest) {
  const access = await requirePermission("forum.moderate");
  if ("denied" in access) return access.denied;
  const parsed = clearSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const cleared = await clearAbout(parsed.data.userId);
  if (!cleared) return NextResponse.json({ error: "No such user." }, { status: 404 });
  await recordAudit(access.session.user, "profile.about.cleared", parsed.data.userId);
  return NextResponse.json({ ok: true });
}
