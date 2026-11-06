"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { PolicyIcon } from "@/components/civic/policy-chip";
import { MemberPhoto } from "@/components/people/member-photo";
import { Button } from "@/components/ui/button";
import { partyLabel } from "@/lib/civic/labels";
import { AGE_OPTIONS, suggestTopics } from "@/lib/civic/onboarding-logic";
import { POLICY_AREAS, policyStyle } from "@/lib/civic/policy-areas";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LocationPicker, type ResolvedLocation } from "./location-picker";

const TOTAL_STEPS = 3;

type Rep = { id: number; name: string; imageUrl: string | null; party: string | null; role: string; seat: string };

async function save(body: Record<string, unknown>) {
  const response = await fetch("/api/civic/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("save failed");
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-extrabold text-muted-foreground">
        Step {step + 1} of {TOTAL_STEPS}
      </p>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step + 1}
        data-testid="onboarding-progress"
        className="h-3 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-support transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * One card in the stack. The current card sits on top. Ones already done lift away and fade, and
 * the next one waits behind, scaled down and peeking out, then moves up when its turn comes.
 */
function StepCard({ index, step, children }: { index: number; step: number; children: React.ReactNode }) {
  const current = index === step;
  const offset = index - step;
  return (
    <section
      aria-hidden={!current}
      inert={!current}
      data-testid={current ? "onboarding-card" : undefined}
      data-step={index}
      className={cn(
        "rounded-3xl border-2 border-b-4 p-5 transition-all ease-out motion-reduce:transition-none sm:p-6",
        current
          ? "relative z-20 bg-card opacity-100 delay-100 duration-300"
          : "absolute inset-x-0 top-0 h-full overflow-hidden duration-150",
        offset < 0 && "pointer-events-none z-30 -translate-y-8 bg-card opacity-0",
        offset === 1 && "z-10 translate-y-4 scale-[0.95] bg-muted",
        offset === 2 && "z-0 translate-y-7 scale-[0.9] bg-muted opacity-60",
      )}
    >
      {/* Waiting cards only show their edge, so their contents stay hidden. */}
      <div className={cn(offset > 0 && "invisible")}>{children}</div>
    </section>
  );
}

function AgeStep({ value, onChoose }: { value: string | null; onChoose: (age: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight">How old are you?</h1>
        <p className="text-muted-foreground">So we can suggest what&apos;s most likely to affect you.</p>
      </div>
      <div className="grid grid-cols-2 gap-2" data-testid="age-options">
        {AGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChoose(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              "min-h-12 rounded-xl border-2 border-b-4 px-3 py-2 text-left font-bold transition-colors active:translate-y-px active:border-b-2",
              option.value === "PREFER_NOT_TO_SAY" && "col-span-2",
              value === option.value ? "border-primary bg-primary-tint" : "bg-card hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RepsFound({ reps, onContinue }: { reps: Rep[]; onContinue: () => void }) {
  return (
    <div className="space-y-4" data-testid="onboarding-reps">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight">
          {reps.length > 0 ? "Found them! These are your reps" : "Your location is saved"}
        </h1>
        <p className="text-muted-foreground">
          {reps.length > 0
            ? "They vote on your behalf. Soon you'll see how often you agree."
            : "We'll show your representatives on your dashboard."}
        </p>
      </div>
      <ul className="space-y-2">
        {reps.map((rep) => (
          <li key={rep.id} className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
            <MemberPhoto name={rep.name} url={rep.imageUrl} party={rep.party} size={48} />
            <div className="min-w-0">
              <p className="break-words font-extrabold leading-snug">{rep.name}</p>
              <p className="text-sm text-muted-foreground">
                {rep.role}, {rep.seat} · {partyLabel(rep.party)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Button size="lg" className="w-full" onClick={onContinue} data-testid="onboarding-next">
        Continue
      </Button>
    </div>
  );
}

function TopicsStep({
  suggested,
  chosen,
  onToggle,
  onFinish,
  saving,
}: {
  suggested: string[];
  chosen: Set<string>;
  onToggle: (name: string) => void;
  onFinish: () => void;
  saving: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const others = POLICY_AREAS.map((area) => area.name).filter((name) => !suggested.includes(name));
  const names = showAll ? [...suggested, ...others] : suggested;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight">What should we keep an eye on?</h1>
        <p className="text-muted-foreground">
          We picked these based on your age and state. Tap to change them anytime.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2" data-testid="topic-options">
        {names.map((name) => {
          const on = chosen.has(name);
          const { color, tint } = policyStyle(name);
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onToggle(name)}
                aria-pressed={on}
                style={on ? { backgroundColor: tint, borderColor: color } : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-1.5 rounded-full border-2 border-b-4 px-3 py-1.5 text-left text-sm font-bold transition-colors active:translate-y-px active:border-b-2",
                  !on && "bg-card hover:bg-muted",
                )}
              >
                {on ? (
                  <Check className="size-4 shrink-0" style={{ color }} aria-hidden />
                ) : (
                  <PolicyIcon name={name} className="size-4 shrink-0" style={{ color }} aria-hidden />
                )}
                {name}
              </button>
            </li>
          );
        })}
      </ul>
      {!showAll ? (
        <button
          type="button"
          className="min-h-11 text-sm font-extrabold text-primary hover:underline"
          onClick={() => setShowAll(true)}
          data-testid="show-all-topics"
        >
          See all {POLICY_AREAS.length} topics
        </button>
      ) : null}
      <Button size="lg" className="w-full" onClick={onFinish} disabled={saving} data-testid="onboarding-finish">
        {saving ? "Saving…" : chosen.size > 0 ? "Take me to my dashboard" : "Skip topics for now"}
      </Button>
    </div>
  );
}

export function OnboardingFlow({
  initialAge,
  initialRegion,
  initialTopics,
}: {
  initialAge: string | null;
  initialRegion: string | null;
  initialTopics: string[];
}) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(initialAge);
  const [region, setRegion] = useState(initialRegion);
  const [reps, setReps] = useState<Rep[] | null>(null);
  // Null until they choose for themselves. Until then, it follows their first two answers.
  const [picked, setPicked] = useState<Set<string> | null>(initialTopics.length > 0 ? new Set(initialTopics) : null);
  const [saving, setSaving] = useState(false);

  const suggested = suggestTopics(age, region);
  const chosen = picked ?? new Set(suggested);

  const chooseAge = (value: string) => {
    setAge(value);
    setStep(1);
    // A failed save isn't worth stopping for. Settings can set it later.
    save({ ageRange: value }).catch(() => undefined);
  };

  const onResolved = async ({ regionCode, districtCode }: ResolvedLocation) => {
    setRegion(regionCode);
    try {
      const query = new URLSearchParams({ state: regionCode });
      if (districtCode) query.set("district", districtCode);
      const response = await fetch(`/api/civic/reps?${query}`);
      if (!response.ok) throw new Error();
      setReps((await response.json()).reps);
    } catch {
      setReps([]);
    }
  };

  const toggle = (name: string) => {
    const next = new Set(chosen);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setPicked(next);
  };

  const finish = async (topics: string[] | null) => {
    setSaving(true);
    try {
      await save({ ...(topics ? { topics } : {}), complete: true });
      await update().catch(() => undefined);
      router.replace(routes.dashboard);
    } catch {
      setSaving(false);
      toast.error("That didn't save. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-6 sm:py-10" data-testid="onboarding">
      <ProgressBar step={step} />

      <div className="relative pb-6">
        <StepCard index={0} step={step}>
          <AgeStep value={age} onChoose={chooseAge} />
        </StepCard>
        <StepCard index={1} step={step}>
          {reps ? (
            <RepsFound reps={reps} onContinue={() => setStep(2)} />
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold leading-tight">Where do you live?</h1>
                <p className="text-muted-foreground">This tells us who represents you in Congress.</p>
              </div>
              {/* Only mounted on its turn, because it asks the browser for a location right away. */}
              {step === 1 ? <LocationPicker autoLocate onResolved={onResolved} /> : null}
            </div>
          )}
        </StepCard>
        <StepCard index={2} step={step}>
          <TopicsStep
            suggested={suggested}
            chosen={chosen}
            onToggle={toggle}
            onFinish={() => finish([...chosen])}
            saving={saving}
          />
        </StepCard>
      </div>

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex min-h-11 items-center gap-1 text-sm font-extrabold text-muted-foreground hover:text-foreground"
            data-testid="onboarding-back"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => finish(null)}
          disabled={saving}
          className="min-h-11 text-sm font-bold text-muted-foreground underline"
          data-testid="onboarding-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
