"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { RunDetailSkeleton } from "@/components/app/skeletons";
import { OuterBlock } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PipelineRun, RunLogLine } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatWhen, RunStatus } from "./run-status";
import { usePolling } from "./use-polling";

const LEVEL: Record<string, string> = {
  ERROR: "text-oppose",
  CRITICAL: "text-oppose",
  WARNING: "text-streak",
};

/** One run's result and log, which keeps adding lines while the run is going. */
export function RunLog({ runId }: { runId: number }) {
  const run = usePolling<PipelineRun>(`/api/admin/pipelines/runs/${runId}`, 4000);
  const active = run.data?.status === "running";
  const [lines, setLines] = useState<RunLogLine[]>([]);
  const [follow, setFollow] = useState(true);
  const [failed, setFailed] = useState(false);
  const lastId = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch(`/api/admin/pipelines/runs/${runId}/logs?after=${lastId.current}&limit=500`);
          if (!response.ok) throw new Error();
          const fresh: RunLogLine[] = await response.json();
          if (!stopped && fresh.length > 0) {
            lastId.current = fresh[fresh.length - 1].id;
            setLines((current) => [...current, ...fresh].slice(-5000));
          }
          if (!stopped) setFailed(false);
          // A full page means there's more waiting, so fetch again straight away.
          if (!stopped && fresh.length === 500) {
            timer = setTimeout(load, 0);
            return;
          }
        } catch {
          if (!stopped) setFailed(true);
        }
      }
      // A finished run gets no new lines, so this only keeps checking while it's going.
      if (!stopped && (active || run.data === null)) timer = setTimeout(load, 2500);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [runId, active, run.data]);

  useEffect(() => {
    if (follow && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [lines, follow]);

  if (run.error && !run.data) {
    return (
      <OuterBlock data-testid="run-missing">
        <p className="flex items-center gap-2 font-extrabold">
          <AlertTriangle className="size-5 text-streak" aria-hidden />
          {run.error}
        </p>
      </OuterBlock>
    );
  }
  if (!run.data) return <RunDetailSkeleton />;
  const data = run.data;

  return (
    <div className="space-y-4" data-testid="run-detail">
      <OuterBlock className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 break-words text-2xl font-extrabold">{data.pipeline}</h1>
          <RunStatus status={data.status} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Started", formatWhen(data.startedAt)],
            ["Took", formatDuration(data.durationSeconds)],
            ["Requests", data.requests.toLocaleString()],
            ["Changed", data.documentsChanged.toLocaleString()],
            ["Unchanged", data.documentsUnchanged.toLocaleString()],
            ["Records", data.recordsWritten.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-extrabold text-muted-foreground">{label}</dt>
              <dd className="font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="break-words text-sm text-muted-foreground">Started by {data.trigger.replace("panel:", "")}</p>
        {data.error ? (
          <p role="alert" className="whitespace-pre-wrap break-words rounded-xl bg-oppose-tint p-3 font-mono text-sm" data-testid="run-error">
            {data.error}
          </p>
        ) : null}
      </OuterBlock>

      <OuterBlock className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">Log</h2>
          <div className="flex items-center gap-2">
            <Switch id="follow-log" checked={follow} onCheckedChange={setFollow} />
            <Label htmlFor="follow-log">Follow new lines</Label>
          </div>
        </div>
        {failed ? (
          <p role="alert" className="text-sm font-bold">
            The log isn&apos;t loading. <Button variant="link" className="h-auto px-0" onClick={() => setFailed(false)}>Dismiss</Button>
          </p>
        ) : null}
        <div
          ref={box}
          tabIndex={0}
          role="log"
          aria-label="Run log"
          className="max-h-[60vh] min-h-40 overflow-auto rounded-xl bg-muted p-3 font-mono text-xs leading-relaxed"
          data-testid="run-log"
        >
          {lines.length === 0 ? (
            <p className="text-muted-foreground" data-testid="run-log-empty">
              {active ? "Waiting for the first line…" : "No log was saved for this run. Only runs started by this server have one."}
            </p>
          ) : (
            lines.map((line) => (
              <p key={line.id} className="whitespace-pre-wrap break-words" data-testid="log-line">
                <span className="text-muted-foreground">{formatWhen(line.at)}</span>{" "}
                <span className={cn("font-bold", LEVEL[line.level])}>{line.level}</span> {line.message}
              </p>
            ))
          )}
        </div>
      </OuterBlock>
    </div>
  );
}
