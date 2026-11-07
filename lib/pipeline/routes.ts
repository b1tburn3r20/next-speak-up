// What the admin panel may ask the pipeline server. It's an explicit list rather than a general
// proxy, so a request can never reach anything else. Pure, so it can be tested.
import type { PermissionName } from "@/lib/auth/permissions";

export type PipelineRoute = {
  permission: PermissionName;
  /** A short name for the audit log. Reads aren't logged. */
  audit?: string;
  /** Query parameters passed through. Anything else is dropped. */
  query?: string[];
  /** Reads that scan a lot of data get longer. */
  timeoutMs?: number;
  /** Whether the server should be told who's asking. */
  sendsActor?: boolean;
};

type Pattern = { method: string; path: RegExp; route: PipelineRoute };

const VIEW = "pipelines.view" as const;
const MANAGE = "pipelines.manage" as const;

const PATTERNS: Pattern[] = [
  { method: "GET", path: /^status$/, route: { permission: VIEW } },
  { method: "GET", path: /^pipelines$/, route: { permission: VIEW } },
  { method: "GET", path: /^runs$/, route: { permission: VIEW, query: ["pipeline", "status", "limit", "before"] } },
  { method: "GET", path: /^runs\/\d+$/, route: { permission: VIEW } },
  { method: "GET", path: /^runs\/\d+\/logs$/, route: { permission: VIEW, query: ["after", "limit"] } },
  { method: "GET", path: /^metrics$/, route: { permission: VIEW, query: ["days"], timeoutMs: 20_000 } },
  { method: "GET", path: /^issues$/, route: { permission: VIEW, query: ["severity", "check", "limit"] } },
  { method: "POST", path: /^pipelines\/[a-z0-9_]{1,80}\/run$/, route: { permission: MANAGE, audit: "pipeline.run", sendsActor: true } },
  { method: "POST", path: /^daily\/run$/, route: { permission: MANAGE, audit: "pipeline.run_daily", sendsActor: true } },
  { method: "POST", path: /^stop$/, route: { permission: MANAGE, audit: "pipeline.stop", sendsActor: true } },
  { method: "DELETE", path: /^queue\/[a-f0-9]{1,32}$/, route: { permission: MANAGE, audit: "pipeline.cancel_queued" } },
  { method: "PUT", path: /^schedule$/, route: { permission: MANAGE, audit: "pipeline.schedule", sendsActor: true } },
];

export function matchPipelineRoute(method: string, segments: string[]): PipelineRoute | null {
  const path = segments.join("/");
  return PATTERNS.find((pattern) => pattern.method === method && pattern.path.test(path))?.route ?? null;
}

/** Keeps only the listed query parameters. */
export function filterQuery(params: URLSearchParams, allowed: string[] = []): string {
  const kept = new URLSearchParams();
  for (const name of allowed) {
    const value = params.get(name);
    if (value !== null && value !== "") kept.set(name, value);
  }
  const text = kept.toString();
  return text ? `?${text}` : "";
}

/** Who's asking is set here on the server, so a browser can't claim to be someone else. */
export function withActor(body: unknown, actor: string): Record<string, unknown> {
  const fields = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  return { ...fields, actor: actor.slice(0, 60) };
}
