"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { chamberName, type ChamberKind, type ClientState } from "@/lib/civic/states";

function districtOptions(count: number) {
  return [
    { value: "", label: "I'm not sure" },
    ...Array.from({ length: count }, (_, index) => ({ value: String(index + 1), label: `District ${index + 1}` })),
  ];
}

/** For someone who chose their state by hand, so we never asked the Census for their districts. */
export function StateSeatPicker({
  state,
  initialLower,
  initialUpper,
  initialCity,
}: {
  state: ClientState;
  initialLower: string | null;
  initialUpper: string | null;
  /** The key of the city they live in, if it's one we cover. */
  initialCity: string | null;
}) {
  const router = useRouter();
  const [seats, setSeats] = useState<Record<ChamberKind, string>>({ LOWER: initialLower ?? "", UPPER: initialUpper ?? "" });
  const [city, setCity] = useState(initialCity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/civic/location/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lower: seats.LOWER || null, upper: seats.UPPER || null, city: city || null }),
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
        {(["LOWER", "UPPER"] as const).map((kind) => (
          <div key={kind} className="space-y-1">
            <p className="text-sm font-extrabold">{chamberName(state, kind)} district</p>
            <OptionSelect
              aria-label={`${chamberName(state, kind)} district`}
              value={seats[kind]}
              onValueChange={(value) => setSeats((current) => ({ ...current, [kind]: value }))}
              options={districtOptions(state.chambers[kind].seats)}
              placeholder="I'm not sure"
              data-testid={`seat-${kind.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
      {state.cities.length > 0 ? (
        <div className="space-y-1">
          <p className="text-sm font-extrabold">Your city</p>
          <OptionSelect
            aria-label="Your city"
            value={city}
            onValueChange={setCity}
            options={[{ value: "", label: "Somewhere else" }, ...state.cities.map((option) => ({ value: option.key, label: option.name }))]}
            placeholder="Somewhere else"
            data-testid="seat-city"
          />
        </div>
      ) : null}
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
