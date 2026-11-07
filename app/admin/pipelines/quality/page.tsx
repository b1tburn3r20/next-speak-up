import type { Metadata } from "next";
import Link from "next/link";
import { OuterBlock, PageHeader } from "@/components/blocks";
import { formatWhen } from "@/components/admin/run-status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePagePermission } from "@/lib/admin/access";
import { pipelineFailed, pipelineFetch } from "@/lib/pipeline/client";
import type { QualityIssue } from "@/lib/pipeline/types";

export const metadata: Metadata = { title: "Data checks" };

export default async function DataQualityPage() {
  await requirePagePermission("pipelines.view");
  const result = await pipelineFetch<QualityIssue[]>("issues?limit=500");
  const failed = pipelineFailed(result);
  const issues = pipelineFailed(result) ? [] : result.data;
  const errors = issues.filter((issue) => issue.severity === "error").length;
  return (
    <div className="space-y-6">
      <Link href="/admin/pipelines" className="tap text-sm font-bold text-primary hover:underline">
        ← All pipelines
      </Link>
      <PageHeader
        title="Data checks"
        description={!failed ? `${errors} errors and ${issues.length - errors} warnings still open. They close by themselves once a run fixes them.` : undefined}
      />
      <OuterBlock data-testid="quality-issues">
        {pipelineFailed(result) ? (
          <p className="font-bold" data-testid="quality-down">{result.message}</p>
        ) : issues.length === 0 ? (
          <p className="text-muted-foreground">No open problems.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id} data-testid="quality-row">
                    <TableCell className="font-extrabold">{issue.severity}</TableCell>
                    <TableCell className="break-words">{issue.check}</TableCell>
                    <TableCell className="break-words">{issue.entity}</TableCell>
                    <TableCell className="break-words font-medium">{issue.message}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(issue.lastSeenAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </OuterBlock>
    </div>
  );
}
