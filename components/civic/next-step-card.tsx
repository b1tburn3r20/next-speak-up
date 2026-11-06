import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { NextStep } from "@/lib/civic/next-steps";
import { cn } from "@/lib/utils";

const TONE: Record<NextStep["tone"], { card: string; button: "default" | "support" | "streak" | "xp" }> = {
  primary: { card: "border-primary bg-primary-tint", button: "default" },
  support: { card: "border-support bg-support-tint", button: "support" },
  streak: { card: "border-streak bg-streak-tint", button: "streak" },
  xp: { card: "border-xp bg-xp-tint", button: "xp" },
};

/** The clear next thing to do. Every page should end with one. */
export function NextStepCard({ step, label = "Next up" }: { step: NextStep; label?: string }) {
  const tone = TONE[step.tone];
  return (
    <div
      className={cn("space-y-3 rounded-2xl border-2 border-b-4 p-4 sm:p-5", tone.card)}
      data-testid="next-step"
      data-step={step.id}
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-extrabold leading-snug">{step.title}</p>
        <p className="text-sm">{step.description}</p>
      </div>
      <Link
        href={step.href}
        className={cn(buttonVariants({ variant: tone.button, size: "lg" }), "w-full sm:w-auto")}
        data-testid="next-step-action"
      >
        {step.cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A quieter list of other things to do. */
export function MoreSteps({ steps }: { steps: NextStep[] }) {
  if (steps.length === 0) return null;
  return (
    <ul className="space-y-2" data-testid="more-steps">
      {steps.map((step) => (
        <li key={step.id}>
          <Link
            href={step.href}
            className="flex items-center justify-between gap-3 rounded-xl border-2 border-b-4 bg-card p-3 transition-colors hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block font-bold leading-snug">{step.title}</span>
              <span className="block text-sm text-muted-foreground">{step.description}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
