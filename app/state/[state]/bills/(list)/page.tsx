import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/page-states";
import { BillCards } from "@/components/bills/bill-cards";
import { PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { StateSessionNote } from "@/components/state/session-note";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { listBills, listPolicyAreas } from "@/lib/civic/bills";
import { BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";
import { stateByKey } from "@/lib/civic/states";
import { notFound } from "next/navigation";
import { stateRoutes } from "@/lib/routes";

type StateParams = { params: Promise<{ state: string }> };

async function stateFrom(params: StateParams["params"]) {
  const state = stateByKey((await params).state);
  // The layout already turned away states we don't cover. This keeps the type honest.
  if (!state) notFound();
  return state;
}

export async function generateMetadata({ params }: StateParams): Promise<Metadata> {
  const state = await stateFrom(params);
  return { title: "Bills", description: `Search bills from ${state.legislature}, with their real status.` };
}

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

export default async function StateBillsPage({ params: route, searchParams }: StateParams & { searchParams: Promise<SearchParams> }) {
  const state = await stateFrom(route);
  const params = await searchParams;
  const status = params.status && params.status in BILL_STATUS_LABELS ? (params.status as BillStatusValue) : undefined;
  const [{ bills, nextCursor }, policyAreas] = await Promise.all([
    listBills({ jurisdiction: state.jurisdiction, q: params.q, status, policyArea: params.policyArea, cursor: params.cursor }),
    listPolicyAreas(state.jurisdiction),
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
      <PageHeader title={`${state.name} bills`} description="From this session, most recently active first." />
      <StateSessionNote state={state} />
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto_auto]" role="search">
        <Input
          className="col-span-2 lg:col-span-1"
          name="q"
          defaultValue={params.q}
          placeholder={`Search by title or number, like ${state.billExample}`}
          aria-label={`Search ${state.name} bills`}
          data-testid="state-bill-search"
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
        A bill&apos;s topic comes from the committee it went to, because {state.name} doesn&apos;t label bills by topic.
      </p>
      {bills.length > 0 ? (
        <Stack data-testid="state-bill-list">
          <BillCards bills={bills} />
          {nextCursor ? (
            <Link href={`${stateRoutes(state.key).bills}?${nextParams}`} className={buttonVariants({ variant: "outline" })} data-testid="next-page">
              Next page
            </Link>
          ) : null}
        </Stack>
      ) : (
        <EmptyState title={filtering ? "No bills match that" : "No bills yet"}>
          {filtering ? "Try fewer filters, or a different word." : "They'll appear here once they've loaded."}
        </EmptyState>
      )}
    </PageSpacer>
  );
}
