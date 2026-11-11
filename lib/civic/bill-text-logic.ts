// Pure logic for bill text. No database access here, so it's easy to test.

// About 50,000 words. A longer bill gets answered from its first part, and the AI is told so.
export const MAX_PROMPT_CHARS = 300_000;
// Read-aloud costs money per character, so it reads the summary rather than the whole bill.
export const MAX_SPEECH_CHARS = 4_000;

type VersionLike = { versionType: string; issuedOn: Date | null };

/**
 * The newest version of a bill's text. Public Law is final. An Enrolled Bill has no date from
 * the API, and comes right before that. After those, the latest date wins.
 */
export function pickLatestTextVersion<T extends VersionLike>(versions: T[]): T | null {
  const rank = (version: T) => {
    if (version.versionType === "Public Law") return Number.POSITIVE_INFINITY;
    if (version.issuedOn === null) return Number.MAX_SAFE_INTEGER;
    return version.issuedOn.getTime();
  };
  return [...versions].sort((a, b) => rank(b) - rank(a))[0] ?? null;
}

/** Summaries are stored as HTML. Speech and prompts need plain text. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|li|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// Where a bill's text may be fetched from. Anything else is refused, so a bad URL in the data can't
// make the server request some other site.
const TEXT_HOSTS = new Set(["www.congress.gov", "congress.gov", "www.govinfo.gov", "govinfo.gov"]);

/** Whether the app may fetch this text address on someone's behalf. */
export function isFetchableTextUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && TEXT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * A bill's text page as plain text. Those pages are one <pre> block, and its line breaks carry
 * meaning (sections, indents), so they're kept, unlike `htmlToPlainText`, which is for summaries.
 */
export function billHtmlToText(html: string): string {
  const body = html
    .replace(/<(script|style|title)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
  return body
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cuts at a sentence or word, so speech doesn't stop mid-word. */
export function clampText(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  const slice = text.slice(0, max);
  const sentence = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(".\n"));
  if (sentence > max / 2) return { text: slice.slice(0, sentence + 1), truncated: true };
  const word = slice.lastIndexOf(" ");
  return { text: word > 0 ? slice.slice(0, word) : slice, truncated: true };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** The conversation must start with the user, and a long one keeps only its latest messages. */
export function prepareChatHistory(messages: ChatMessage[], keep = 10): ChatMessage[] {
  const recent = messages.slice(-keep);
  const firstUser = recent.findIndex((message) => message.role === "user");
  return firstUser === -1 ? [] : recent.slice(firstUser);
}
