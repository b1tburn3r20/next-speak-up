"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { billActionMap } from "@/lib/data/billActionMap";
import { FullUserLegislationData } from "@/lib/types/bill-types";
import { cn } from "@/lib/utils";

function getActionLabel(code: string, fallback?: string): string {
  return billActionMap.find((e) => e.code === code)?.label ?? fallback ?? code;
}

// ── Stages ────────────────────────────────────────────────────────────────────
const INTRO_CODES = new Set(["1000", "1025"]);

const STAGE_LABELS = ["Introduced", "Committee", "House Floor", "Senate", "President", "Became Law"];

const STAGE_RANGES = [
  { min: 2000, max: 5500 }, // 1 - Committee
  { min: 7000, max: 9000 }, // 2 - House Floor
  { min: 11000, max: 18000 }, // 3 - Senate
  { min: 28000, max: 31000 }, // 4 - President
  { min: 36000, max: 40000 }, // 5 - Became Law
];

function getStageIndex(code: string): number | null {
  if (INTRO_CODES.has(code)) return 0;
  const n = parseInt(code);
  if (isNaN(n)) return null;
  for (let i = 0; i < STAGE_RANGES.length; i++) {
    if (n >= STAGE_RANGES[i].min && n <= STAGE_RANGES[i].max) return i + 1;
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type StageDetail = {
  code: string;
  date: string;
};

type BillAnalysis = {
  furthestStep: number;
  currentStep: number;
  isStalled: boolean;
  lastActionDate: string | null;
  stageDetails: Record<number, StageDetail>;
};

const STALE_DAYS = 180;

// ── Analysis ──────────────────────────────────────────────────────────────────
function analyzeBill(actions: FullUserLegislationData["legislation"]["actions"]): BillAnalysis {
  const sorted = [...actions].sort(
    (a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime()
  );

  let furthestStep = -1;
  let currentStep = -1;
  const stageDetails: Record<number, StageDetail> = {};

  for (const action of sorted) {
    const stage = getStageIndex(action.actionCode);
    if (stage === null) continue;

    if (stage > furthestStep) furthestStep = stage;
    currentStep = stage;

    stageDetails[stage] = {
      code: action.actionCode,
      date: new Date(action.actionDate).toISOString(),
    };
  }

  const lastRaw = sorted[sorted.length - 1]?.actionDate ?? null;
  const lastActionDate = lastRaw ? new Date(lastRaw).toISOString() : null;
  const daysSinceLast = lastActionDate
    ? Math.floor((Date.now() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  return {
    furthestStep,
    currentStep,
    isStalled: daysSinceLast > STALE_DAYS,
    lastActionDate,
    stageDetails,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
interface BillTimelineProps {
  actions: FullUserLegislationData["legislation"]["actions"];
}

const BillTimeline = ({ actions }: BillTimelineProps) => {
  if (!actions?.length) return null;

  const { furthestStep, currentStep, isStalled, lastActionDate, stageDetails } =
    analyzeBill(actions);

  const notStarted = furthestStep === -1;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full space-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {STAGE_LABELS.map((label, i) => {
            const isFurthest = i === furthestStep;
            const isCurrent = i === currentStep;
            const isPast = i < currentStep;
            const isReached = i <= furthestStep;
            const detail = stageDetails[i];

            const pill = (
              <div
                key={label}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none",
                  !isReached && "bg-muted text-muted-foreground border-transparent opacity-40",
                  isPast && "bg-muted text-muted-foreground border-transparent",
                  isFurthest && !isCurrent && "bg-orange-500/50 text-foreground border-transparent",
                  isCurrent && "bg-primary/50 text-foreground border-transparent"
                )}
              >
                {label}
              </div>
            );

            if (!detail) return pill;

            return (
              <Tooltip key={label}>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center">
                  <p className="font-medium text-xs">{getActionLabel(detail.code)}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {formatDate(detail.date)}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {isStalled && !notStarted && (
            <div className="px-3 py-1 rounded-full text-xs font-medium border border-destructive/40 text-destructive bg-destructive/10">
              Stalled
            </div>
          )}
        </div>

        {lastActionDate && (
          <p className="text-xs text-muted-foreground pl-0.5">
            Last action {formatDate(lastActionDate)}
            {isStalled && " · No recent movement"}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};

export default BillTimeline;
