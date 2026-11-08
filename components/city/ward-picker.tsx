"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";

/** The city doesn't publish ward boundaries, so people choose theirs, with the city's own finder to help. */
export function WardPicker({
  cityKey,
  wards,
  wardFinderUrl,
  initialWard,
}: {
  cityKey: string;
  wards: number;
  wardFinderUrl: string;
  initialWard: string | null;
}) {
  const router = useRouter();
  const [ward, setWard] = useState(initialWard ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/civic/location/city", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityKey, ward: ward || null }),
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
    <div className="space-y-2" data-testid="ward-picker">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1 space-y-1">
          <p className="text-sm font-extrabold">Your ward</p>
          <OptionSelect
            aria-label="Your ward"
            value={ward}
            onValueChange={setWard}
            options={[{ value: "", label: "I'm not sure" }, ...Array.from({ length: wards }, (_, index) => ({ value: String(index + 1), label: `Ward ${index + 1}` }))]}
            placeholder="I'm not sure"
            data-testid="ward-select"
          />
        </div>
        <Button disabled={saving} onClick={save} data-testid="ward-save">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <a href={wardFinderUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ExternalLink className="size-4" aria-hidden />
        Find your ward with the city&apos;s address lookup
      </a>
      {error ? (
        <p role="alert" className="rounded-xl bg-oppose-tint p-2.5 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
