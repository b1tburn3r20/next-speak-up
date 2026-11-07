// Charts in plain SVG and CSS, so they render on the server and add no client JavaScript. Following
// the data visualization skill: thin marks, one hue per job, a name beside every bar, text in text
// colors, and a text alternative on every chart.
import { policyStyle } from "@/lib/civic/policy-areas";
import type { VerdictTone } from "@/lib/civic/verdict";
import { cn } from "@/lib/utils";
import { PolicyIcon } from "./policy-chip";

const TONE_COLOR: Record<VerdictTone, string> = {
  good: "var(--support)",
  mixed: "var(--streak)",
  bad: "var(--oppose)",
  unknown: "var(--input)",
};

/** A ring with the score in the middle. With no score, it shows how close they are to one. */
export function AlignmentRing({
  percent,
  tone,
  size = 88,
  progress = 0,
}: {
  percent: number | null;
  tone: VerdictTone;
  size?: number;
  /** For an unknown score: how much of the way to a verdict, from 0 to 1. */
  progress?: number;
}) {
  const stroke = Math.max(6, Math.round(size / 11));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = percent === null ? progress : percent / 100;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={percent === null ? "No score yet" : `${percent}% agreement`}
      data-testid="alignment-ring"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent === null ? "var(--primary)" : TONE_COLOR[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * filled} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-extrabold leading-none">
        {percent === null ? "?" : `${percent}%`}
      </span>
    </div>
  );
}

export type PolicyBarRow = { policyArea: string; value: number; detail?: string };

/** Horizontal bars by policy area, each in its family color, with the name and number beside it. */
export function PolicyBars({
  rows,
  label,
  max = 8,
  testId,
  suffix = "",
  scale,
}: {
  rows: PolicyBarRow[];
  label: string;
  max?: number;
  testId?: string;
  /** Added after each number, like "%". */
  suffix?: string;
  /** What a full bar means. By default, the largest value. */
  scale?: number;
}) {
  // A percentage of zero still means something, so only counts drop their empty rows.
  const shown = (scale ? rows : rows.filter((row) => row.value > 0)).slice(0, max);
  const highest = scale ?? Math.max(1, ...shown.map((row) => row.value));
  return (
    <ul className="space-y-2.5" aria-label={label} data-testid={testId}>
      {shown.map((row) => {
        const { color } = policyStyle(row.policyArea);
        return (
          <li key={row.policyArea} title={row.detail}>
            <div className="mb-0.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                <PolicyIcon name={row.policyArea} className="size-3.5 shrink-0" style={{ color }} aria-hidden />
                <span className="min-w-0 truncate">{row.policyArea}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {row.value}
                {suffix}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(row.value / highest) * 100}%`, backgroundColor: color }}
              />
            </div>
            {row.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** How a member split between yes and no in each policy area. */
export function VoteSplitBars({
  rows,
  max = 8,
}: {
  rows: { policyArea: string; yea: number; nay: number }[];
  max?: number;
}) {
  const shown = rows
    .filter((row) => row.yea + row.nay > 0)
    .sort((a, b) => b.yea + b.nay - (a.yea + a.nay))
    .slice(0, max);
  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs font-bold" aria-hidden>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-chart-support" /> Yes
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-chart-oppose" /> No
        </span>
      </div>
      <ul className="space-y-2.5" aria-label="Final votes by policy area" data-testid="vote-split">
        {shown.map((row) => {
          const total = row.yea + row.nay;
            const { color } = policyStyle(row.policyArea);
          return (
            <li key={row.policyArea}>
              <div className="mb-0.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                  <PolicyIcon name={row.policyArea} className="size-3.5 shrink-0" style={{ color }} aria-hidden />
                  <span className="min-w-0 truncate">{row.policyArea}</span>
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums">
                  {row.yea} yes · {row.nay} no
                </span>
              </div>
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                {row.yea > 0 ? (
                  <div className="bg-chart-support" style={{ width: `${(row.yea / total) * 100}%` }} />
                ) : null}
                {row.nay > 0 ? <div className="flex-1 bg-chart-oppose" /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A big number with a plain label, and how it compares with peers when we know. */
export function StatTile({
  value,
  label,
  hint,
  className,
  testId,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-muted p-3", className)} data-testid={testId}>
      <p className="text-2xl font-extrabold leading-tight tabular-nums">{value}</p>
      <p className="text-sm font-bold">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Votes per week, so a quiet stretch and a busy one are easy to see. */
export function ActivityChart({ weeks }: { weeks: { weekStart: Date; votes: number }[] }) {
  const highest = Math.max(1, ...weeks.map((week) => week.votes));
  const total = weeks.reduce((sum, week) => sum + week.votes, 0);
  return (
    <div
      role="img"
      aria-label={`${total} votes over the last ${weeks.length} weeks`}
      className="flex h-16 items-end gap-1"
    >
      {weeks.map((week) => (
        <div
          key={week.weekStart.toISOString()}
          title={`${week.votes} votes`}
          className="flex-1 rounded-t bg-primary"
          style={{ height: `${Math.max(6, (week.votes / highest) * 100)}%`, opacity: week.votes ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}
