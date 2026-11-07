import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/require-permission";
import prisma from "@/prisma/client";

const schema = z.object({ action: z.literal("restore-leaderboard"), userId: z.string().min(1).max(40) });

/** Puts a name back on the leaderboard. They still have to have joined it themselves. */
export async function POST(request: NextRequest) {
  const access = await requirePermission("forum.moderate");
  if ("denied" in access) return access.denied;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const changed = await prisma.user.updateMany({
    where: { id: parsed.data.userId },
    data: { leaderboardHiddenAt: null },
  });
  if (changed.count === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await recordAudit(access.session.user, "leaderboard.restored", parsed.data.userId);
  return NextResponse.json({ ok: true });
}
