import type { Metadata } from "next";
import { PageHeader } from "@/components/blocks";
import { PipelinesDashboard } from "@/components/admin/pipelines-dashboard";
import { requirePagePermission } from "@/lib/admin/access";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Pipelines" };

export default async function PipelinesPage() {
  const session = await requirePagePermission("pipelines.view");
  return (
    <div className="space-y-6">
      <PageHeader title="Data pipelines" description="Where the app's government data comes from, and whether it's arriving." />
      <PipelinesDashboard canManage={can(session, "pipelines.manage")} />
    </div>
  );
}
