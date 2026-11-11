"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, Database, Play, Server, Square, X } from "lucide-react";
import { toast } from "sonner";
import { PipelinesSkeleton, TableSkeleton } from "@/components/app/skeletons";
import { OuterBlock, Section } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/ui/option-select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DailyMetric, PipelineInfo, PipelineMetrics, PipelineRun, ServerStatus } from "@/lib/pipeline/types";
import { formatBytes, formatDuration, formatWhen, RunStatus } from "./run-status";
import { usePolling } from "./use-polling";

const API = "/api/admin/pipelines";

async function act(path: string, method: string, body?: unknown) {
  const response = await fetch(`${API}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "That didn't work.");
  return data;
}

function ServerProblem({ reason, message }: { reason: string | null; message: string | null }) {
  return (
    <OuterBlock className="space-y-2" data-testid="pipeline-server-problem" data-reason={reason ?? "ERROR"}>
      <p className="flex items-center gap-2 text-lg font-extrabold">
        <AlertTriangle className="size-5 text-streak" aria-hidden />
        {reason === "NOT_CONFIGURED" ? "The pipeline server isn't set up here" : "Can't reach the pipeline server"}
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {reason === "NOT_CONFIGURED" ? (
        <p className="text-sm">
          Set <code className="font-bold">PIPELINE_SERVER_URL</code> and <code className="font-bold">PIPELINE_SERVER_TOKEN</code>{" "}in the app&apos;s <code className="font-bold">.env</code>, then restart it.
        </p>
      ) : (
        <p className="text-sm">
          On Railway, check the pipeline service is running, and that <code className="font-bold">PIPELINE_SERVER_URL</code> is{" "}
          <code className="font-bold">http://</code> plus its private name and <code className="font-bold">:8787</code>. On this computer, start Docker,
          then run <code className="font-bold">docker compose up -d</code> in <code className="font-bold">civic-pipeline</code>.
        </p>
      )}
    </OuterBlock>
  );
}

function Tile({ icon: Icon, label, value, detail }: { icon: typeof Server; label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border-2 border-b-4 bg-card p-3" data-testid="pipeline-tile">
      <p className="flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-extrabold tabular-nums">{value}</p>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function RunDialog({ pipeline, onClose, onStarted }: { pipeline: PipelineInfo; onClose: () => void; onStarted: () => void }) {
  const [limit, setLimit] = useState("");
  const [maxRequests, setMaxRequests] = useState("");
  const [withDependencies, setWithDependencies] = useState(false);
  const [saving, setSaving] = useState(false);

  const start = async () => {
    setSaving(true);
    try {
      await act(`pipelines/${pipeline.name}/run`, "POST", {
        ...(limit ? { limit: Number(limit) } : {}),
        ...(maxRequests ? { maxRequests: Number(maxRequests) } : {}),
        withDependencies,
      });
      toast.success(`${pipeline.name} is queued`);
      onStarted();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent data-testid="run-dialog">
        <DialogHeader>
          <DialogTitle className="break-words">Run {pipeline.name}</DialogTitle>
          <DialogDescription>{pipeline.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="run-limit">Most items to process</Label>
            <Input id="run-limit" type="number" min={1} max={100000} value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="No limit" data-testid="run-limit" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="run-max">Most web requests</Label>
            <Input id="run-max" type="number" min={1} max={50000} value={maxRequests} onChange={(event) => setMaxRequests(event.target.value)} placeholder="No limit" data-testid="run-max" />
            <p className="text-xs text-muted-foreground">A run that reaches this saves its place and can pick up later.</p>
          </div>
          {pipeline.dependsOn.length > 0 ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Label htmlFor="run-deps">Run what it depends on first</Label>
                <p className="mt-1 break-words text-xs text-muted-foreground">{pipeline.dependsOn.join(", ")}</p>
              </div>
              <Switch id="run-deps" checked={withDependencies} onCheckedChange={setWithDependencies} />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={start} data-testid="run-confirm">
            <Play className="size-4" aria-hidden />
            {saving ? "Starting…" : "Run it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** One measure per chart, so there's only ever one axis to read. */
function DailyBars({ title, days, measure }: { title: string; days: DailyMetric[]; measure: "requests" | "records" | "runs" }) {
  const highest = Math.max(1, ...days.map((day) => day[measure]));
  const total = days.reduce((sum, day) => sum + day[measure], 0);
  return (
    <div data-testid={`chart-${measure}`}>
      <p className="flex items-baseline justify-between gap-2 text-sm font-extrabold">
        {title}
        <span className="tabular-nums text-muted-foreground">{total.toLocaleString()}</span>
      </p>
      <div role="img" aria-label={`${title}: ${total} over ${days.length} days`} className="mt-2 flex h-24 items-end gap-0.5 border-b-2">
        {days.map((day) => (
          <div
            key={day.day}
            title={`${day.day}: ${day[measure].toLocaleString()} ${title.toLowerCase()}`}
            className="min-w-0 flex-1 rounded-t bg-primary transition-[height] duration-300 motion-reduce:transition-none"
            style={{ height: `${Math.max(day[measure] ? 4 : 0, (day[measure] / highest) * 100)}%` }}
          />
        ))}
      </div>
      <p className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{days[0]?.day.slice(5)}</span>
        <span>{days[days.length - 1]?.day.slice(5)}</span>
      </p>
    </div>
  );
}

function RunsTable({ runs }: { runs: PipelineRun[] }) {
  if (runs.length === 0) return <p className="text-sm text-muted-foreground">No runs match that.</p>;
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[640px]" data-testid="runs-table">
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Took</TableHead>
            <TableHead>Requests</TableHead>
            <TableHead>Records</TableHead>
            <TableHead>Started by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id} data-testid="run-row">
              <TableCell>
                <Link href={`/admin/pipelines/runs/${run.id}`} className="font-bold text-primary hover:underline">
                  {run.pipeline}
                </Link>
              </TableCell>
              <TableCell>
                <RunStatus status={run.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatWhen(run.startedAt)}</TableCell>
              <TableCell>{formatDuration(run.durationSeconds)}</TableCell>
              <TableCell className="tabular-nums">{run.requests.toLocaleString()}</TableCell>
              <TableCell className="tabular-nums">{run.recordsWritten.toLocaleString()}</TableCell>
              <TableCell className="break-words">{run.trigger.replace("panel:", "")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PipelinesDashboard({ canManage }: { canManage: boolean }) {
  const status = usePolling<ServerStatus>(`${API}/status`, 4000);
  const busy = Boolean(status.data?.busy || status.data?.queue.length);
  const pipelines = usePolling<PipelineInfo[]>(`${API}/pipelines`, busy ? 5000 : 30000);
  const metrics = usePolling<PipelineMetrics>(`${API}/metrics`, 60000);
  const [statusFilter, setStatusFilter] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("");
  const query = new URLSearchParams({ limit: "25", ...(statusFilter ? { status: statusFilter } : {}), ...(pipelineFilter ? { pipeline: pipelineFilter } : {}) });
  const runs = usePolling<PipelineRun[]>(`${API}/runs?${query}`, busy ? 5000 : 30000);
  const [running, setRunning] = useState<PipelineInfo | null>(null);
  const [acting, setActing] = useState(false);

  const refreshAll = () => {
    status.refresh();
    pipelines.refresh();
    runs.refresh();
  };

  const perform = async (path: string, method: string, body: unknown, done: string) => {
    setActing(true);
    try {
      await act(path, method, body);
      toast.success(done);
      refreshAll();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setActing(false);
    }
  };

  if (!status.data && status.error) return <ServerProblem reason={status.reason} message={status.error} />;
  if (!status.data) return <PipelinesSkeleton />;

  const server = status.data;
  const open = metrics.data?.quality.open ?? {};
  const list = pipelines.data ?? [];
  const failing = list.filter((pipeline) => pipeline.lastRun?.status === "failed");

  return (
    <div className="space-y-8" data-testid="pipelines-dashboard">
      {status.error ? (
        <p role="alert" className="rounded-xl bg-oppose-tint p-3 text-sm font-bold">
          Lost contact with the server. Showing the last known state.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4" data-testid="pipeline-tiles">
        <Tile icon={Server} label="Server" value={server.busy ? "Working" : "Idle"} detail={`Up ${formatDuration(server.uptimeSeconds)}`} />
        <Tile
          icon={CalendarClock}
          label="Nightly run"
          value={server.scheduleEnabled ? "On" : "Off"}
          detail={server.lastDailyRun ? `Last: ${server.lastDailyRun}` : "Hasn't run yet"}
        />
        <Tile icon={Database} label="Bills loaded" value={metrics.data?.tables.bill?.toLocaleString() ?? "—"} detail={`${metrics.data?.tables.person?.toLocaleString() ?? "—"} people`} />
        <Tile
          icon={AlertTriangle}
          label="Data problems"
          value={String(open.error ?? 0)}
          detail={`${open.warning ?? 0} warnings`}
        />
      </div>

      {failing.length > 0 ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-oppose-tint p-3 text-sm font-bold" data-testid="failing-alert">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">Last run failed: {failing.map((pipeline) => pipeline.name).join(", ")}</span>
        </p>
      ) : null}

      <Section title="Right now">
        <OuterBlock className="space-y-3" data-testid="pipeline-activity">
          {server.current ? (
            <div className="flex flex-wrap items-center justify-between gap-3" data-testid="current-job">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-extrabold">
                  <RunStatus status="running" />
                  <span className="break-words">{server.current.names.join(", ")}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Started by {server.current.actor}, {formatWhen(server.current.started_at)}
                  {server.stopping ? ". Stopping at its next request." : ""}
                </p>
              </div>
              {canManage ? (
                <Button
                  variant="secondary"
                  disabled={acting || server.stopping}
                  onClick={() => perform("stop", "POST", {}, "Asked it to stop")}
                  data-testid="stop-run"
                >
                  <Square className="size-4" aria-hidden />
                  {server.stopping ? "Stopping…" : "Stop"}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="server-idle">
              <Activity className="size-4" aria-hidden />
              Nothing is running.
            </p>
          )}
          {server.queue.length > 0 ? (
            <ul className="divide-y text-sm" data-testid="job-queue">
              {server.queue.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0 break-words">
                    <RunStatus status="queued" /> {job.names.join(", ")}, by {job.actor}
                  </span>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${job.names.join(", ")} from the queue`}
                      disabled={acting}
                      onClick={() => perform(`queue/${job.id}`, "DELETE", undefined, "Removed from the queue")}
                    >
                      <X className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {canManage ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 pt-3">
              <div className="flex min-w-0 items-start gap-3">
                <Switch
                  id="nightly"
                  checked={server.scheduleEnabled}
                  disabled={acting}
                  onCheckedChange={(enabled) =>
                    perform("schedule", "PUT", { enabled }, enabled ? "The nightly run is on" : "The nightly run is off")
                  }
                  data-testid="nightly-switch"
                />
                <div className="min-w-0">
                  <Label htmlFor="nightly">Run every night at {server.dailyHour}am</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Catches up if this computer was asleep. Don&apos;t also use the Windows task, or they&apos;ll overlap.
                  </p>
                </div>
              </div>
              <Button disabled={acting} onClick={() => perform("daily/run", "POST", {}, "The daily set is queued")} data-testid="run-daily">
                <Play className="size-4" aria-hidden />
                Run the daily set now
              </Button>
            </div>
          ) : null}
        </OuterBlock>
      </Section>

      <Section title="Pipelines" description="Stubs stay off until their data source is confirmed, so they only run by hand.">
        <OuterBlock>
          {pipelines.error && !pipelines.data ? <p role="alert" className="text-sm">{pipelines.error}</p> : null}
          {!pipelines.data && !pipelines.error ? <TableSkeleton rows={8} columns={6} testId="pipelines-table-skeleton" /> : null}
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]" data-testid="pipelines-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>30-day success</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Schedule</TableHead>
                  {canManage ? <TableHead>Run</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((pipeline) => (
                  <TableRow key={pipeline.name} data-testid="pipeline-row" data-name={pipeline.name}>
                    <TableCell className="max-w-64">
                      <p className="break-words font-extrabold">{pipeline.name}</p>
                      <p className="break-words text-xs font-medium text-muted-foreground">{pipeline.description}</p>
                    </TableCell>
                    <TableCell>
                      <RunStatus status={pipeline.lastRun?.status ?? "never"} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(pipeline.lastRun?.startedAt)}</TableCell>
                    <TableCell className="tabular-nums">
                      {pipeline.runs30d > 0 ? `${pipeline.successes30d} of ${pipeline.runs30d}` : "—"}
                    </TableCell>
                    <TableCell>{formatDuration(pipeline.avgSeconds)}</TableCell>
                    <TableCell>{pipeline.schedule ?? "By hand"}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => setRunning(pipeline)} data-testid="run-pipeline" aria-label={`Run ${pipeline.name}`}>
                          <Play className="size-4" aria-hidden />
                          Run
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </OuterBlock>
      </Section>

      <Section title="Recent runs">
        <OuterBlock className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl">
            <OptionSelect
              aria-label="Filter by result"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "", label: "Any result" },
                { value: "running", label: "Running" },
                { value: "success", label: "Succeeded" },
                { value: "partial", label: "Stopped early" },
                { value: "failed", label: "Failed" },
                { value: "stopped", label: "Stopped" },
                { value: "interrupted", label: "Interrupted" },
              ]}
            />
            <OptionSelect
              aria-label="Filter by pipeline"
              value={pipelineFilter}
              onValueChange={setPipelineFilter}
              options={[{ value: "", label: "Any pipeline" }, ...list.map((pipeline) => ({ value: pipeline.name, label: pipeline.name }))]}
            />
          </div>
          {runs.data ? <RunsTable runs={runs.data} /> : runs.error ? <p role="alert" className="text-sm">{runs.error}</p> : <TableSkeleton rows={5} columns={6} testId="runs-skeleton" />}
        </OuterBlock>
      </Section>

      {!metrics.data && !metrics.error ? <TableSkeleton rows={6} testId="metrics-skeleton" /> : null}
      {metrics.data ? (
        <>
          <Section title="Last 14 days">
            <OuterBlock className="space-y-3" data-testid="pipeline-charts">
              <div className="grid gap-5 md:grid-cols-3 [&>*]:min-w-0">
                <DailyBars title="Runs" days={metrics.data.daily} measure="runs" />
                <DailyBars title="Web requests" days={metrics.data.daily} measure="requests" />
                <DailyBars title="Records written" days={metrics.data.daily} measure="records" />
              </div>
              <Disclosure title="See this as a table" data-testid="metrics-table">
                <div className="overflow-x-auto">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Runs</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Records</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.data.daily.map((day) => (
                        <TableRow key={day.day}>
                          <TableCell>{day.day}</TableCell>
                          <TableCell>{day.runs}</TableCell>
                          <TableCell>{day.failures}</TableCell>
                          <TableCell>{day.requests.toLocaleString()}</TableCell>
                          <TableCell>{day.records.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Disclosure>
            </OuterBlock>
          </Section>

          <div className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
            <Section title="Stored from each source">
              <OuterBlock>
                <div className="overflow-x-auto">
                  <Table data-testid="sources-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Last fetched</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.data.sources.map((source) => (
                        <TableRow key={source.source}>
                          <TableCell className="break-words">{source.source}</TableCell>
                          <TableCell className="tabular-nums">{source.documents.toLocaleString()}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatBytes(source.bytes)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatWhen(source.lastFetchedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </OuterBlock>
            </Section>
            <Section title="Data checks" action={{ href: "/admin/pipelines/quality", label: "See all" }}>
              <OuterBlock data-testid="quality-summary">
                {metrics.data.quality.byCheck.length > 0 ? (
                  <ul className="divide-y text-sm">
                    {metrics.data.quality.byCheck.slice(0, 8).map((row) => (
                      <li key={`${row.check}-${row.severity}`} className="flex items-center justify-between gap-3 py-1.5">
                        <span className="min-w-0 break-words font-bold">{row.check}</span>
                        <span className="shrink-0 tabular-nums">
                          {row.count} {row.severity}
                          {row.count === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No open problems.</p>
                )}
              </OuterBlock>
            </Section>
          </div>
        </>
      ) : null}

      {running ? <RunDialog pipeline={running} onClose={() => setRunning(null)} onStarted={refreshAll} /> : null}
    </div>
  );
}
