// Talks to the pipeline server. Server-only: the token must never reach a browser.
import "server-only";

export type PipelineFailure = { ok: false; reason: "NOT_CONFIGURED" | "UNREACHABLE" | "ERROR"; status: number; message: string };
export type PipelineResult<T> = { ok: true; status: number; data: T } | PipelineFailure;

/** This project compiles without strict mode, where `result.ok` alone doesn't narrow the type. */
export function pipelineFailed<T>(result: PipelineResult<T>): result is PipelineFailure {
  return !result.ok;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export async function pipelineFetch<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<PipelineResult<T>> {
  const base = process.env.PIPELINE_SERVER_URL;
  const token = process.env.PIPELINE_SERVER_TOKEN;
  if (!base || !token) {
    return { ok: false, reason: "NOT_CONFIGURED", status: 503, message: "The pipeline server isn't set up here." };
  }
  try {
    const response = await fetch(`${base}/${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        reason: "ERROR",
        status: response.status,
        message: typeof data?.detail === "string" ? data.detail : "The pipeline server refused that.",
      };
    }
    return { ok: true, status: response.status, data: data as T };
  } catch {
    // Never pass the underlying error on: it could include the address.
    return { ok: false, reason: "UNREACHABLE", status: 503, message: "The pipeline server isn't responding." };
  }
}
