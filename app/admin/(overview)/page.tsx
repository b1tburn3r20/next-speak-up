import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bug, Database, Lightbulb, UserPlus, Users, Vote, type LucideIcon } from "lucide-react";
import { Grid, OuterBlock, PageHeader, Section, WithRail } from "@/components/blocks";
import { formatWhen, RunStatus } from "@/components/admin/run-status";
import { requirePagePermission } from "@/lib/admin/access";
import { getOverview, listAudit } from "@/lib/admin/queries";
import { can } from "@/lib/auth/permissions";
import { pipelineFailed, pipelineFetch } from "@/lib/pipeline/client";
import type { PipelineMetrics, ServerStatus } from "@/lib/pipeline/types";

export const metadata: Metadata = { title: "Admin" };

function Tile({ icon: Icon, label, value, detail, href }: { icon: LucideIcon; label: string; value: string; detail?: string; href?: string }) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
    </>
  );
  const className = "block rounded-2xl border-2 border-b-4 bg-card p-3";
  return href ? (
    <Link href={href} className={`${className} hover:bg-muted`} data-testid="admin-tile">
      {body}
    </Link>
  ) : (
    <div className={className} data-testid="admin-tile">
      {body}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const session = await requirePagePermission("admin.view");
  const canSeePipelines = can(session, "pipelines.view");
  const canSeeAudit = can(session, "audit.view");
  const canManageUsers = can(session, "users.manage");
  const canSeeFeedback = can(session, "feedback.view");
  const [overview, status, metrics, audit] = await Promise.all([
    getOverview(),
    canSeePipelines ? pipelineFetch<ServerStatus>("status") : null,
    canSeePipelines ? pipelineFetch<PipelineMetrics>("metrics", { timeoutMs: 15_000 }) : null,
    canSeeAudit ? listAudit({}) : null,
  ]);
  const highest = Math.max(1, ...overview.signups.map((day) => day.count));
  const open = metrics && !pipelineFailed(metrics) ? metrics.data.quality.open : null;

  return (
    <div className="space-y-8" data-testid="admin-overview">
      <PageHeader title="Admin" description="How the app and its data are doing." />

      <Grid cols="stats">
        <Tile icon={Users} label="Accounts" value={overview.users.toLocaleString()} detail={`${overview.newUsers} new this week`} href={canManageUsers ? "/admin/users" : undefined} />
        <Tile icon={UserPlus} label="Voted this week" value={overview.activeUsers.toLocaleString()} detail="People, not votes" />
        <Tile icon={Vote} label="Votes cast" value={overview.votes.toLocaleString()} detail={`${overview.votesThisWeek} this week`} />
        <Tile icon={Database} label="Bills" value={overview.bills.toLocaleString()} detail={`${overview.people.toLocaleString()} people`} />
        {canSeeFeedback ? <Tile icon={Bug} label="Open bug reports" value={String(overview.openBugs)} href="/admin/feedback" /> : null}
        {canSeeFeedback ? <Tile icon={Lightbulb} label="Open ideas" value={String(overview.openIdeas)} href="/admin/feedback" /> : null}
        {open ? <Tile icon={AlertTriangle} label="Data problems" value={String(open.error ?? 0)} detail={`${open.warning ?? 0} warnings`} href="/admin/pipelines/quality" /> : null}
      </Grid>

      <WithRail
        lead={
          <Section title="New accounts, last 14 days">
            <OuterBlock>
              <div
                role="img"
                aria-label={`${overview.signups.reduce((sum, day) => sum + day.count, 0)} new accounts in 14 days`}
                className="flex h-32 items-end gap-1 border-b-2"
                data-testid="signups-chart"
              >
                {overview.signups.map((day) => (
                  <div
                    key={day.day}
                    title={`${day.day}: ${day.count}`}
                    className="min-w-0 flex-1 rounded-t bg-primary"
                    style={{ height: `${day.count ? Math.max(4, (day.count / highest) * 100) : 0}%` }}
                  />
                ))}
              </div>
              <p className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{overview.signups[0]?.day.slice(5)}</span>
                <span>{overview.signups[overview.signups.length - 1]?.day.slice(5)}</span>
              </p>
            </OuterBlock>
          </Section>
        }
        rail={
          canSeePipelines ? (
            <OuterBlock className="space-y-2" data-testid="admin-pipeline-card">
              <h2 className="text-lg font-extrabold">Data pipelines</h2>
              {status && !pipelineFailed(status) ? (
                <>
                  {status.data.current ? (
                    <p className="break-words text-sm">
                      <RunStatus status="running" /> {status.data.current.names.join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing is running.</p>
                  )}
                  <p className="text-sm">Nightly run: {status.data.scheduleEnabled ? "on" : "off"}</p>
                </>
              ) : (
                <p className="text-sm font-bold" data-testid="admin-pipeline-down">The pipeline server isn&apos;t responding.</p>
              )}
              <Link href="/admin/pipelines" className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
                Open pipelines
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </OuterBlock>
          ) : null
        }
      >
        {audit ? (
          <Section title="Recent changes" action={{ href: "/admin/audit", label: "See all" }}>
            <OuterBlock>
              {audit.rows.length > 0 ? (
                <ul className="divide-y text-sm" data-testid="admin-recent-audit">
                  {audit.rows.slice(0, 8).map((row) => (
                    <li key={row.id} className="flex flex-wrap justify-between gap-x-3 py-1.5">
                      <span className="min-w-0 break-words">
                        <strong>{row.actorName}</strong> {row.action}
                        {row.target ? `: ${row.target}` : ""}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatWhen(row.createdAt.toISOString())}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
              )}
            </OuterBlock>
          </Section>
        ) : null}
      </WithRail>
    </div>
  );
}
