import type { Metadata } from "next";
import { PageSpacer } from "@/components/blocks";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/bills/bill-card";
import { EmptyState, Panel } from "@/components/app/page-states";
import { getBillText } from "@/lib/civic/bills";
import { billLabel } from "@/lib/civic/labels";
import { billPath } from "@/lib/routes";
import { Suspense } from "react";
import { BillTextSkeleton } from "@/components/app/skeletons";
import { billTextExists } from "@/lib/civic/exists";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = await getBillText((await params).id);
  if (!found) return { title: "Bill not found" };
  return { title: `Text of ${billLabel(found.bill.billType, found.bill.number)}` };
}

async function BillTextBody({ params }: PageProps) {
  const found = await getBillText((await params).id);
  if (!found) notFound();
  const { bill, latest, text, tooLarge } = found;
  const label = billLabel(bill.billType, bill.number);

  return (
    <PageSpacer>
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
            {text ? " · From Congress.gov" : ""}
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
        <EmptyState
          title={
            !latest?.htmlUrl
              ? "Congress hasn't published text for this bill yet"
              : tooLarge
                ? "This bill is too long to show here"
                : "Congress.gov didn't answer just now"
          }
        >
          {latest?.htmlUrl ? (
            <a href={latest.htmlUrl} target="_blank" rel="noreferrer" className="underline">
              Read it on Congress.gov
            </a>
          ) : (
            "Its text appears once it's printed."
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
    </PageSpacer>
  );
}

export default async function BillTextPage(props: PageProps) {
  const { id } = await props.params;
  if (!(await billTextExists(id))) notFound();
  return (
    <Suspense fallback={<BillTextSkeleton />}>
      <BillTextBody {...props} />
    </Suspense>
  );
}
