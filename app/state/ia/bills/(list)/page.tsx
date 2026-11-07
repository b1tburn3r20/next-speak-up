import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/page-states";
import { BillCards } from "@/components/bills/bill-cards";
import { PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { IowaSessionNote } from "@/components/state/session-note";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { listBills, listPolicyAreas } from "@/lib/civic/bills";
import { BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";
import { IOWA_CODE } from "@/lib/civic/state";
import { stateRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Iowa bills",
  description: "Search bills from the Iowa Legislature, with their real status.",
};

type SearchParams = { q?: string; status?: string; policyArea?: string; cursor?: string };

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "SIGNED", label: "Signed into law" },
  { value: "VETOED", label: "Vetoed" },
  { value: "PASSED_BOTH_CHAMBERS", label: "Passed both chambers" },
  { value: "PASSED_ORIGIN_CHAMBER", label: "Passed one chamber" },
  { value: "REPORTED", label: "Reported by committee" },
  { value: "IN_COMMITTEE", label: "In committee" },
  { value: "AGREED_TO", label: "Resolution agreed to" },
];

export default async function IowaBillsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const status = params.status && params.status in BILL_STATUS_LABELS ? (params.status as BillStatusValue) : undefined;
  const [{ bills, nextCursor }, policyAreas] = await Promise.all([
    listBills({ jurisdiction: IOWA_CODE, q: params.q, status, policyArea: params.policyArea, cursor: params.cursor }),
    listPolicyAreas(IOWA_CODE),
  ]);
  const filtering = Boolean(params.q || status || params.policyArea);
  const nextParams = new URLSearchParams({
    ...(params.q ? { q: params.q } : {}),
    ...(status ? { status } : {}),
    ...(params.policyArea ? { policyArea: params.policyArea } : {}),
    ...(nextCursor ? { cursor: nextCursor } : {}),
  });

  return (
    <PageSpacer>
      <PageHeader title="Iowa bills" description="From the 91st General Assembly, most recently active first." />
      <IowaSessionNote />
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto_auto]" role="search">
        <Input
          className="col-span-2 lg:col-span-1"
          name="q"
          defaultValue={params.q}
          placeholder="Search by title or number, like HF 100"
          aria-label="Search Iowa bills"
          data-testid="iowa-bill-search"
        />
        <OptionSelect name="status" defaultValue={status ?? ""} aria-label="Status" options={STATUS_OPTIONS} />
        <OptionSelect
          name="policyArea"
          defaultValue={params.policyArea ?? ""}
          aria-label="Topic"
          options={[{ value: "", label: "Any topic" }, ...policyAreas.map((area) => ({ value: area, label: area }))]}
        />
        <Button type="submit" className="col-span-2 lg:col-span-1">Search</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        A bill&apos;s topic comes from the committee it went to, because Iowa doesn&apos;t label bills by topic.
      </p>
      {bills.length > 0 ? (
        <Stack data-testid="iowa-bill-list">
          <BillCards bills={bills} />
          {nextCursor ? (
            <Link href={`${stateRoutes.bills}?${nextParams}`} className={buttonVariants({ variant: "outline" })} data-testid="next-page">
              Next page
            </Link>
          ) : null}
        </Stack>
      ) : (
        <EmptyState title={filtering ? "No Iowa bills match that" : "No Iowa bills yet"}>
          {filtering ? "Try fewer filters, or a different word." : "They'll appear here once they've loaded."}
        </EmptyState>
      )}
    </PageSpacer>
  );
}
