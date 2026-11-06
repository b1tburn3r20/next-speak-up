import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/bills/bill-card";
import { EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { getBillText } from "@/lib/civic/bills";
import { billLabel } from "@/lib/civic/labels";
import { billPath } from "@/lib/routes";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = await getBillText((await params).id);
  if (!found) return { title: "Bill not found" };
  return { title: `Text of ${billLabel(found.bill.billType, found.bill.number)}` };
}

export default async function BillTextPage({ params }: PageProps) {
  const found = await getBillText((await params).id);
  if (!found) notFound();
  const { bill, latest, text, fetchedAt } = found;
  const label = billLabel(bill.billType, bill.number);

  return (
    <PageContainer>
      <header className="space-y-1">
        <nav className="text-sm">
          <Link href={billPath(bill.slug)} className="underline">
            Back to {label}
          </Link>
        </nav>
        <h1 className="break-words text-xl font-semibold">Text of {label}</h1>
        <p className="break-words text-sm text-muted-foreground">{bill.title}</p>
        {latest ? (
          <p className="text-sm text-muted-foreground">
            {latest.versionType}
            {latest.issuedOn ? `, ${formatDate(latest.issuedOn)}` : ""}
            {fetchedAt ? ` · Fetched ${formatDate(fetchedAt)}` : ""}
          </p>
        ) : null}
      </header>

      {text ? (
        <Panel aria-label="Bill text">
          <pre
            data-testid="bill-full-text"
            className="whitespace-pre-wrap break-words font-mono text-xs font-normal leading-relaxed sm:text-sm"
          >
            {text}
          </pre>
        </Panel>
      ) : (
        <EmptyState title="We don't have this text stored yet">
          {latest?.htmlUrl ? (
            <a href={latest.htmlUrl} target="_blank" rel="noreferrer" className="underline">
              Read it on Congress.gov
            </a>
          ) : (
            "Congress hasn't published text for this bill yet."
          )}
        </EmptyState>
      )}

      {bill.textVersions.length > 1 ? (
        <Panel aria-labelledby="versions-heading">
          <h2 id="versions-heading" className="mb-2 font-semibold">
            All versions
          </h2>
          <ul className="space-y-1 text-sm">
            {bill.textVersions.map((version) => (
              <li key={version.versionType} className="break-words">
                {version.versionType}
                {version.issuedOn ? `, ${formatDate(version.issuedOn)}` : ""}:{" "}
                {version.htmlUrl ? (
                  <a href={version.htmlUrl} target="_blank" rel="noreferrer" className="underline">
                    Read
                  </a>
                ) : null}{" "}
                {version.pdfUrl ? (
                  <a href={version.pdfUrl} target="_blank" rel="noreferrer" className="underline">
                    PDF
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </PageContainer>
  );
}
