// Makes a CRS summary digestible by choosing from its own sentences. It never rewords them, so it
// can't change the meaning. No AI is involved.
import { htmlToPlainText } from "./bill-text-logic";

export type BillDigest = {
  /** The sentence or two that says what the bill does. */
  lead: string;
  /** Up to three more points, if the summary has them. */
  points: string[];
  /** Whether the full summary has more than this. */
  hasMore: boolean;
};

const BOILERPLATE = [
  /^the following (analysis|summary) is based on/i,
  /may differ from the (bill text|text) as introduced/i,
  /^this (measure|bill) has not been amended since it was introduced/i,
  /^\(this measure has not been amended/i,
  /^\(sec\. ?\d+\)$/i,
];

const MAX_LEAD_CHARS = 280;

/** Splits on sentence ends, without being fooled by "H.R. 1", "U.S.", or "Sec. 4". */
export function splitSentences(text: string): string[] {
  const protectedText = text
    .replace(/\b(H\.R|S\.J|H\.J|H\.Res|S\.Res|H\.Con|S\.Con|U\.S\.C|U\.S|No|Sec|Dr|Mr|Ms|Mrs|Inc|Jr|vs|e\.g|i\.e)\./g, "$1\u0000")
    .replace(/\b([A-Z])\.(?=[A-Z\s])/g, "$1\u0000");
  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z("])|\n+/)
    .map((sentence) => sentence.replace(/\u0000/g, ".").trim())
    .filter(Boolean);
}

function isBoilerplate(sentence: string): boolean {
  return BOILERPLATE.some((pattern) => pattern.test(sentence));
}

/** A line with no sentence ending is usually the bill's name as a heading. */
function isHeading(sentence: string): boolean {
  return !/[.!?:;]$/.test(sentence) && sentence.split(/\s+/).length < 25;
}

/** Null when there's no summary, so the page can handle that gap on purpose. */
export function buildDigest(summaryHtml: string | null | undefined): BillDigest | null {
  if (!summaryHtml) return null;
  const sentences = splitSentences(htmlToPlainText(summaryHtml)).filter(
    (sentence) => !isBoilerplate(sentence) && !isHeading(sentence),
  );
  if (sentences.length === 0) return null;
  let lead = sentences[0];
  let next = 1;
  // A very short opener needs the next sentence to make sense.
  if (lead.length < 80 && sentences[1] && lead.length + sentences[1].length <= MAX_LEAD_CHARS) {
    lead = `${lead} ${sentences[1]}`;
    next = 2;
  }
  const points = sentences.slice(next, next + 3).filter((sentence) => sentence.length <= 320);
  return { lead, points, hasMore: sentences.length > next + points.length };
}
