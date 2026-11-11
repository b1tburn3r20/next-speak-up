import { LegiText } from "@/components/glossary/legi-text";
import Link from "next/link";
import { FileText, Vote } from "lucide-react";
import { InShortHeading } from "@/components/bills/in-short-heading";
import { VoteGateActions } from "@/components/bills/vote-gate-actions";
import { PolicyChip } from "@/components/civic/policy-chip";
import type { buildDigest } from "@/lib/civic/digest";

/**
 * Vote first, then find out. Rendered by the server as a card in the page, rather than a dialog in
 * a portal, so it's there from the first paint. Where the bill stands isn't sent until they choose.
 */
export function VoteGateCard({
  slug,
  label,
  title,
  policyArea,
  explanation,
  digest,
  summarySource = "CRS",
  textHref,
  floorNotice,
  sponsor,
}: {
  slug: string;
  label: string;
  title: string;
  policyArea: string | null;
  explanation: string | null;
  digest: ReturnType<typeof buildDigest>;
  /** Whose words "In short" quotes. */
  summarySource?: "CRS" | "BILL_EXPLANATION";
  textHref: string | null;
  /** When it may come up, which is a reason to weigh in now. */
  floorNotice: string | null;
  sponsor: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="gate-title"
      className="animate-rise-in space-y-4 rounded-3xl border-2 border-b-8 border-primary bg-card p-5 sm:p-7"
      data-testid="vote-gate"
    >
      <p className="flex items-center gap-1.5 text-sm font-extrabold text-primary">
        <Vote className="size-4" aria-hidden />
        What do you think? Vote, then see where it stands.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-extrabold">{label}</span>
        <PolicyChip name={policyArea} />
      </div>
      <h1 id="gate-title" className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">
        {title}
      </h1>
      {floorNotice ? (
        <p className="rounded-xl bg-primary-tint p-3 text-sm font-bold" data-testid="floor-notice">
          On the House floor schedule: {floorNotice}. A vote may happen, so now&apos;s the time to weigh in.
        </p>
      ) : null}
      {digest ? (
        <div className="space-y-2">
          <InShortHeading source={summarySource} />
          <p className="text-lg font-semibold leading-relaxed" data-testid="digest-lead">
            <LegiText text={digest.lead} />
          </p>
          {digest.points.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {digest.points.map((point) => (
                <li key={point}>
                  <LegiText text={point} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground" data-testid="no-summary">
          There&apos;s no official summary yet, so the title is the best description we have.
        </p>
      )}
      {explanation ? <p className="text-sm text-muted-foreground">{explanation}</p> : null}
      {sponsor ? (
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-muted-foreground">Who wrote it</p>
          {sponsor}
        </div>
      ) : null}
      {textHref ? (
        <Link
          href={textHref}
          className="tap inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
          data-testid="bill-text-link"
        >
          <FileText className="size-4" aria-hidden />
          Read the full text
        </Link>
      ) : null}
      <VoteGateActions slug={slug} />
    </section>
  );
}
