import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Loader2, OctagonX, PauseCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; icon: LucideIcon; className: string; spin?: boolean }> = {
  running: { label: "Running", icon: Loader2, className: "bg-primary-tint", spin: true },
  queued: { label: "Queued", icon: Clock, className: "bg-muted" },
  success: { label: "Succeeded", icon: CheckCircle2, className: "bg-support-tint" },
  partial: { label: "Stopped early", icon: AlertTriangle, className: "bg-streak-tint" },
  failed: { label: "Failed", icon: OctagonX, className: "bg-oppose-tint" },
  stopped: { label: "Stopped", icon: PauseCircle, className: "bg-streak-tint" },
  interrupted: { label: "Interrupted", icon: AlertTriangle, className: "bg-streak-tint" },
  skipped: { label: "Skipped", icon: CircleDashed, className: "bg-muted" },
  never: { label: "Never run", icon: CircleDashed, className: "bg-muted" },
};

/** Status always carries an icon and a word, so color is never the only signal. */
export function RunStatus({ status }: { status: string }) {
  const style = STATUS[status] ?? { label: status, icon: CircleDashed, className: "bg-muted" };
  const Icon = style.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-extrabold", style.className)}
      data-testid="run-status"
      data-status={status}
    >
      <Icon className={cn("size-3.5", style.spin && "animate-spin motion-reduce:animate-none")} aria-hidden />
      {style.label}
    </span>
  );
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** The server's times are UTC, without saying so. */
export function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
