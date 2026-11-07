import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunLog } from "@/components/admin/run-log";
import { requirePagePermission } from "@/lib/admin/access";

export const metadata: Metadata = { title: "Pipeline run" };

export default async function PipelineRunPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("pipelines.view");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/pipelines" className="tap text-sm font-bold text-primary hover:underline">
        ← All pipelines
      </Link>
      <RunLog runId={Number(id)} />
    </div>
  );
}
