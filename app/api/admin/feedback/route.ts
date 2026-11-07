import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/require-permission";
import prisma from "@/prisma/client";

const schema = z.object({
  kind: z.enum(["bug", "idea"]),
  id: z.number().int().positive(),
  resolved: z.boolean(),
});

/** Marks feedback as dealt with, or not. */
export async function PATCH(request: NextRequest) {
  const access = await requirePermission("feedback.view");
  if ("denied" in access) return access.denied;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { kind, id, resolved } = parsed.data;
  const data = { resolvedAt: resolved ? new Date() : null };
  const changed =
    kind === "bug"
      ? await prisma.bugReport.updateMany({ where: { id }, data })
      : await prisma.featureSuggestion.updateMany({ where: { id }, data });
  if (changed.count === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await recordAudit(access.session.user, resolved ? "feedback.resolved" : "feedback.reopened", `${kind}:${id}`);
  return NextResponse.json({ ok: true });
}
