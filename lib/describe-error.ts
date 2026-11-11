// Turns a thrown error into one log line that says what really went wrong. Node's fetch throws a bare
// "fetch failed", with the reason (a timeout, a refused connection, a DNS failure) tucked inside
// `cause`, sometimes as a group of errors with no message of their own. Pure logic.

type Detail = { name?: string; message?: string; code?: string; errno?: number; syscall?: string; address?: string; port?: number; hostname?: string };

function one(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);
  const detail = error as Detail;
  const parts = [
    detail.name && detail.name !== "Error" ? detail.name : null,
    detail.message || null,
    detail.code ?? null,
    detail.syscall ? `${detail.syscall}${detail.hostname ? ` ${detail.hostname}` : ""}` : null,
    detail.address ? `${detail.address}${detail.port ? `:${detail.port}` : ""}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "no details";
}

/** "fetch failed; cause: ConnectTimeoutError UND_ERR_CONNECT_TIMEOUT 148.129.75.136:443", and so on, up to 4 levels deep. */
export function describeError(error: unknown, depth = 0): string {
  if (depth > 3) return "";
  const text = one(error);
  if (!error || typeof error !== "object") return text;
  const grouped = (error as { errors?: unknown[] }).errors;
  const inner = Array.isArray(grouped) && grouped.length > 0 ? ` [${grouped.map((item) => describeError(item, depth + 1)).join("; ")}]` : "";
  const cause = (error as { cause?: unknown }).cause;
  return `${text}${inner}${cause ? `; cause: ${describeError(cause, depth + 1)}` : ""}`;
}
