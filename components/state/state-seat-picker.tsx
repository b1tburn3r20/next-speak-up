"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/ui/option-select";
import { Switch } from "@/components/ui/switch";

const options = (count: number) => [
  { value: "", label: "I'm not sure" },
  ...Array.from({ length: count }, (_, index) => ({ value: String(index + 1), label: `District ${index + 1}` })),
];
const LOWER = options(100);
const UPPER = options(50);

/** For people who chose their state by hand, so we never asked the Census for their districts. */
export function StateSeatPicker({
  initialLower,
  initialUpper,
  initialInDesMoines,
}: {
  initialLower: string | null;
  initialUpper: string | null;
  initialInDesMoines: boolean;
}) {
  const router = useRouter();
  const [lower, setLower] = useState(initialLower ?? "");
  const [upper, setUpper] = useState(initialUpper ?? "");
  const [inDesMoines, setInDesMoines] = useState(initialInDesMoines);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/civic/location/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lower: lower || null, upper: upper || null, inDesMoines }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "That didn't save. Please try again.");
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="state-seat-picker">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-extrabold">Iowa House district</p>
          <OptionSelect aria-label="Iowa House district" value={lower} onValueChange={setLower} options={LOWER} placeholder="I'm not sure" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-extrabold">Iowa Senate district</p>
          <OptionSelect aria-label="Iowa Senate district" value={upper} onValueChange={setUpper} options={UPPER} placeholder="I'm not sure" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="in-des-moines">I live in Des Moines</Label>
        <Switch id="in-des-moines" checked={inDesMoines} onCheckedChange={setInDesMoines} data-testid="in-des-moines" />
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-oppose-tint p-2.5 text-sm font-bold">
          {error}
        </p>
      ) : null}
      <Button disabled={saving} onClick={save} data-testid="state-seat-save">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
