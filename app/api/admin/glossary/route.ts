import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/require-permission";
import { createGlossaryTerm, DEFINITION_MAX, deleteGlossaryTerm, KEYWORD_MAX, updateGlossaryTerm } from "@/lib/glossary/glossary";

const fields = {
  keyword: z.string().trim().min(1, "Give the word.").max(KEYWORD_MAX),
  definition: z.string().trim().min(3, "Say what it means.").max(DEFINITION_MAX),
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object({ id: z.number().int().positive(), ...fields }).strict();
const deleteSchema = z.object({ id: z.number().int().positive() }).strict();

async function parse<T>(request: NextRequest, schema: z.ZodType<T>) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  return parsed.success ? { data: parsed.data } : { error: NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 }) };
}

/** Adds a meaning. A word that already has one gets a second, as an acronym might. */
export async function POST(request: NextRequest) {
  const access = await requirePermission("glossary.manage");
  if ("denied" in access) return access.denied;
  const body = await parse(request, createSchema);
  if ("error" in body) return body.error;
  const row = await createGlossaryTerm(body.data.keyword, body.data.definition, access.session.user.id);
  await recordAudit(access.session.user, "glossary.added", body.data.keyword, body.data.definition.slice(0, 200));
  return NextResponse.json({ id: row.id });
}

export async function PATCH(request: NextRequest) {
  const access = await requirePermission("glossary.manage");
  if ("denied" in access) return access.denied;
  const body = await parse(request, updateSchema);
  if ("error" in body) return body.error;
  if (!(await updateGlossaryTerm(body.data.id, body.data.keyword, body.data.definition, access.session.user.id))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await recordAudit(access.session.user, "glossary.changed", body.data.keyword, body.data.definition.slice(0, 200));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const access = await requirePermission("glossary.manage");
  if ("denied" in access) return access.denied;
  const body = await parse(request, deleteSchema);
  if ("error" in body) return body.error;
  if (!(await deleteGlossaryTerm(body.data.id))) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await recordAudit(access.session.user, "glossary.removed", String(body.data.id));
  return NextResponse.json({ ok: true });
}
