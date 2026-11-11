// Why the pipeline server couldn't be reached, in words an admin can act on, without its address.
// Pure logic, so it's tested without the server.

/** How long the app waits for the pipeline server. Kept in step with lib/pipeline/client.ts. */
const TIMEOUT_SECONDS = 5;

/** The error codes Node's fetch tucks inside "fetch failed", outermost first. */
function errorCodes(error: unknown): string[] {
  const codes: string[] = [];
  const visit = (item: unknown, depth: number) => {
    if (!item || typeof item !== "object" || depth > 4) return;
    const { code, name, errors, cause } = item as { code?: unknown; name?: unknown; errors?: unknown; cause?: unknown };
    if (typeof code === "string") codes.push(code);
    if (name === "TimeoutError" || name === "AbortError") codes.push("TIMEOUT");
    if (Array.isArray(errors)) errors.forEach((inner) => visit(inner, depth + 1));
    visit(cause, depth + 1);
  };
  visit(error, 0);
  return codes;
}

/** What went wrong reaching the pipeline server, and what to check, without its address. */
export function unreachableMessage(error: unknown): string {
  const codes = errorCodes(error);
  const has = (...wanted: string[]) => wanted.some((code) => codes.includes(code));
  const seen = codes.length > 0 ? ` (${[...new Set(codes)].join(", ")})` : "";
  if (has("ERR_INVALID_URL")) {
    return `PIPELINE_SERVER_URL isn't a full address${seen}. It needs http:// at the start, like http://civic-pipeline.railway.internal:8787.`;
  }
  if (has("EPROTO", "ERR_SSL_WRONG_VERSION_NUMBER", "ECONNRESET")) {
    return `The connection was cut off${seen}. If PIPELINE_SERVER_URL starts with https://, use http:// instead: Railway's private network doesn't use https.`;
  }
  if (has("ENOTFOUND", "EAI_AGAIN")) {
    return `No server has that name from here${seen}. Check that PIPELINE_SERVER_URL uses the pipeline service's private name, like http://civic-pipeline.railway.internal:8787.`;
  }
  if (has("ECONNREFUSED")) {
    return `The pipeline service was found, but nothing is listening on that port${seen}. Check the port is 8787, and that the service has started.`;
  }
  if (has("ENETUNREACH", "EHOSTUNREACH")) {
    return `There's no network route to the pipeline service${seen}. On Railway, both services need to be in the same project and environment.`;
  }
  if (has("TIMEOUT", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT")) {
    return `The pipeline service didn't answer within ${TIMEOUT_SECONDS} seconds${seen}. It may still be starting, or busy.`;
  }
  return `The pipeline server isn't responding${seen}.`;
}
