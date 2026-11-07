import type { Metadata } from "next";
import Link from "next/link";
import { formatWhen } from "@/components/admin/run-status";
import { OuterBlock, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePagePermission } from "@/lib/admin/access";
import { listAudit } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  await requirePagePermission("audit.view");
  const params = await searchParams;
  const { total, page, pages, rows, actions } = await listAudit({ action: params.action, page: Number(params.page) || 1 });
  const link = (target: number) => `/admin/audit?${new URLSearchParams({ ...(params.action ? { action: params.action } : {}), page: String(target) })}`;
  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description={`${total.toLocaleString()} recorded changes. These can't be edited from the panel.`} />
      <form className="flex flex-wrap items-center gap-2" aria-label="Filter the log" data-testid="audit-filter">
        <div className="min-w-56">
          <OptionSelect
            name="action"
            aria-label="Action"
            defaultValue={params.action ?? ""}
            options={[{ value: "", label: "Any action" }, ...actions.map((action) => ({ value: action, label: action }))]}
          />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <OuterBlock>
        {rows.length === 0 ? (
          <p className="text-muted-foreground" data-testid="audit-empty">Nothing recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]" data-testid="audit-table">
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>On</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} data-testid="audit-row">
                    <TableCell className="whitespace-nowrap">{formatWhen(row.createdAt.toISOString())}</TableCell>
                    <TableCell className="break-words">{row.actorName}</TableCell>
                    <TableCell className="break-words font-extrabold">{row.action}</TableCell>
                    <TableCell className="max-w-48 break-words">{row.target ?? "—"}</TableCell>
                    <TableCell className="max-w-64 break-words font-medium">{row.detail ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </OuterBlock>
      {pages > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Pages">
          {page > 1 ? <Link href={link(page - 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Newer</Link> : <span />}
          <span className="text-sm font-bold tabular-nums">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(page + 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Older</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
