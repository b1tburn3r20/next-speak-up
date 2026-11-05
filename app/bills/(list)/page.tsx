import type { Metadata } from "next";
import Link from "next/link";
import { BillCard } from "@/components/bills/bill-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageContainer } from "@/components/app/page-states";
import { listBills, listPolicyAreas } from "@/lib/civic/bills";
import { BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";

export const metadata: Metadata = {
  title: "Bills",
  description: "Search and follow federal legislation, with its current status.",
};

type SearchParams = { q?: string; status?: string; policyArea?: string; cursor?: string };

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = params.status && params.status in BILL_STATUS_LABELS
    ? (params.status as BillStatusValue)
    : undefined;
  const [{ bills, nextCursor }, policyAreas] = await Promise.all([
    listBills({ q: params.q, status, policyArea: params.policyArea, cursor: params.cursor }),
    listPolicyAreas(),
  ]);
  const filtering = Boolean(params.q || status || params.policyArea);
  const nextParams = new URLSearchParams({
    ...(params.q ? { q: params.q } : {}),
    ...(status ? { status } : {}),
    ...(params.policyArea ? { policyArea: params.policyArea } : {}),
    ...(nextCursor ? { cursor: nextCursor } : {}),
  });

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold">Bills</h1>
        <p className="text-sm text-muted-foreground">
          Federal legislation, most recently active first.
        </p>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <Input
          name="q"
          defaultValue={params.q}
          placeholder="Search by title or number, like H.R. 1"
          aria-label="Search bills"
        />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className={SELECT_CLASS}>
          <option value="">Any status</option>
          {Object.entries(BILL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="policyArea"
          defaultValue={params.policyArea ?? ""}
          aria-label="Policy area"
          className={SELECT_CLASS}
        >
          <option value="">Any topic</option>
          {policyAreas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {bills.length === 0 ? (
        filtering ? (
          <EmptyState title="No bills match that" action={{ href: "/bills", label: "Clear filters" }}>
            Try a different word or fewer filters.
          </EmptyState>
        ) : (
          <EmptyState title="No bills yet">
            Bills appear here once the data pipeline has run.
          </EmptyState>
        )
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={`/bills?${nextParams}`} data-testid="next-page">
              More bills
            </Link>
          </Button>
        </div>
      ) : null}
    </PageContainer>
  );
}
