// A bill's text, fetched from Congress.gov when someone asks for it, never stored. A published version
// never changes, so Next's data cache keeps each one for 30 days.
//
// Next's data cache skips anything over 2 MB, so the few very long bills are fetched again each time.
// That's rare enough to accept rather than store 80 MB of text for everyone else.
import { billHtmlToText, isFetchableTextUrl } from "./bill-text-logic";

const MONTH_SECONDS = 30 * 24 * 60 * 60;
const TIMEOUT_MS = 10_000;
// Bigger than any bill seen so far (about 4 MB), so a runaway response can't eat the server's memory.
const MAX_BYTES = 8 * 1024 * 1024;
// A plain name, so Congress.gov knows who's asking. robots.txt allows bill pages for every agent.
const USER_AGENT = "Coolbills/1.0 (fetches a bill's text when a reader opens it)";

export type FetchedBillText = { text: string } | { error: "unavailable" | "too-large" };

export async function fetchBillText(url: string | null | undefined): Promise<FetchedBillText> {
  if (!isFetchableTextUrl(url)) return { error: "unavailable" };
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: MONTH_SECONDS, tags: ["bill-text"] },
    });
    if (!response.ok) return { error: "unavailable" };
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) return { error: "too-large" };
    const html = await response.text();
    if (html.length > MAX_BYTES) return { error: "too-large" };
    const text = billHtmlToText(html);
    return text ? { text } : { error: "unavailable" };
  } catch {
    return { error: "unavailable" };
  }
}
