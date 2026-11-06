import { buttonVariants } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { BillCard } from "@/components/bills/bill-card";
import { PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { Input } from "@/components/ui/input";
import { EmptyState, PageContainer } from "@/components/app/page-states";
import { listBills, listPolicyAreas } from "@/lib/civic/bills";
import { BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Bills",
  description: "Search and follow federal legislation, with its current status.",
};

type SearchParams = { q?: string; status?: string; policyArea?: string; cursor?: string };

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
      <PageHeader
        title="Bills"
        description="What Congress is working on, most recently active first."
        action={
          <Link href={routes.federal.topics} className={buttonVariants({ variant: "outline" })} data-testid="browse-topics">
            <Compass className="size-4" aria-hidden />
            Browse by topic
          </Link>
        }
      />
      <Link
        href={routes.federal.upcoming}
        className="flex items-center justify-between gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4 font-extrabold"
        data-testid="upcoming-link"
      >
        See what may come up for a vote next
        <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />
      </Link>

      <form className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <Input
          className="col-span-2 sm:col-span-1"
          name="q"
          defaultValue={params.q}
          placeholder="Search by title or number, like H.R. 1"
          aria-label="Search bills"
        />
        <OptionSelect
          name="status"
          defaultValue={status ?? ""}
          aria-label="Status"
          options={[
            { value: "", label: "Any status" },
            ...Object.entries(BILL_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <OptionSelect
          name="policyArea"
          defaultValue={params.policyArea ?? ""}
          aria-label="Policy area"
          options={[
            { value: "", label: "Any topic" },
            ...policyAreas.map((area) => ({ value: area, label: area })),
          ]}
        />
        <Button className="col-span-2 sm:col-span-1" type="submit">Search</Button>
      </form>

      {bills.length === 0 ? (
        filtering ? (
          <EmptyState title="No bills match that" action={{ href: routes.federal.bills, label: "Clear filters" }}>
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
            <Link href={`${routes.federal.bills}?${nextParams}`} data-testid="next-page">
              More bills
            </Link>
          </Button>
        </div>
      ) : null}
    </PageContainer>
  );
}
