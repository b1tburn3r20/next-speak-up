import { NextRequest, NextResponse } from "next/server";
import { actorName, recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/require-permission";
import { pipelineFailed, pipelineFetch } from "@/lib/pipeline/client";
import { filterQuery, matchPipelineRoute, withActor } from "@/lib/pipeline/routes";
import { isAllowedOrigin } from "@/lib/services/password-auth";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const method = request.method;
  const route = matchPipelineRoute(method, path);
  if (!route) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const access = await requirePermission(route.permission);
  if ("denied" in access) return access.denied;

  // Anything that acts must come from this site, not a page elsewhere using someone's cookie.
  if (method !== "GET" && !isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Request refused." }, { status: 403 });
  }

  const user = access.session.user;
  let body: unknown;
  if (route.sendsActor) body = withActor(await request.json().catch(() => null), actorName(user));

  const result = await pipelineFetch(`${path.join("/")}${filterQuery(request.nextUrl.searchParams, route.query)}`, {
    method,
    body,
    timeoutMs: route.timeoutMs,
  });
  if (pipelineFailed(result)) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: result.status });
  }
  if (route.audit) {
    const { actor: _actor, ...detail } = (body ?? {}) as Record<string, unknown>;
    await recordAudit(user, route.audit, path.join("/"), Object.keys(detail).length ? JSON.stringify(detail) : null);
  }
  return NextResponse.json(result.data, { status: result.status });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
