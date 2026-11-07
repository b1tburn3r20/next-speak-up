"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectSkeleton } from "@/components/app/skeletons";
import { OptionSelect } from "@/components/ui/option-select";
import { STATE_NAMES } from "@/lib/constants/state-names";

export type ResolvedLocation = { regionCode: string; districtCode: string | null };

const STATES = Object.entries(STATE_NAMES as Record<string, string>)
  .sort((a, b) => a[1].localeCompare(b[1]))
  .map(([value, label]) => ({ value, label }));

async function submit(body: unknown): Promise<ResolvedLocation> {
  const response = await fetch("/api/civic/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "We couldn't look that up. Please try again.");
  return data;
}

/**
 * Tries the easiest option first, and always leaves a way forward if one fails. Someone who only
 * knows their state still gets their senators, and can add a district later.
 */
export function LocationPicker({
  onResolved,
  autoLocate = false,
}: {
  onResolved: (location: ResolvedLocation) => void;
  /** Asks the browser right away, instead of waiting for a tap. */
  autoLocate?: boolean;
}) {
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [district, setDistrict] = useState("");
  // Until this finishes, we don't know if the state has one district that's already the answer.
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Someone may pick a state while the browser is still locating them. Their choice wins.
  const choseManually = useRef(false);

  const run = async (body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      onResolved(await submit(body));
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const locate = (quiet: boolean) => {
    if (!("geolocation" in navigator)) {
      if (!quiet) setError("Your browser can't share a location. Choose your state instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (!choseManually.current) run({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setLocating(false);
        // Saying no to a prompt we started isn't an error worth showing.
        if (!quiet) setError("We couldn't get your location. Choose your state instead.");
      },
      { timeout: 10000 },
    );
  };

  const asked = useRef(false);
  useEffect(() => {
    if (!autoLocate || asked.current) return;
    asked.current = true;
    locate(true);
    // Only ever once, when this first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  const chooseState = async (value: string) => {
    choseManually.current = true;
    setState(value);
    setDistrict("");
    setDistricts([]);
    if (!value) return;
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/civic/location/districts?state=${value}`);
      const data = await response.json().catch(() => null);
      const found: string[] = data?.districts ?? [];
      setDistricts(found);
      if (found.length === 1) setDistrict(found[0]);
    } catch {
      // They can still continue with just their state.
    } finally {
      setLoadingDistricts(false);
    }
  };

  return (
    <div className="space-y-4 font-normal">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => {
          choseManually.current = false;
          locate(false);
        }}
        disabled={busy || locating}
        data-testid="use-my-location"
      >
        <LocateFixed className="size-4" />
        {locating || busy ? "Finding you…" : "Use my location"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We only use this to find your district, and we don&apos;t store your location or address.
      </p>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          choseManually.current = true;
          run({ regionCode: state, districtCode: district || null });
        }}
      >
        <Label htmlFor="location-state">Or choose your state</Label>
        <OptionSelect
          id="location-state"
          value={state}
          placeholder="State"
          options={STATES}
          onValueChange={chooseState}
        />
        {state && loadingDistricts ? <SelectSkeleton label="Loading districts" /> : null}
        {state && !loadingDistricts && districts.length > 1 ? (
          <OptionSelect
            aria-label="District"
            value={district}
            onValueChange={setDistrict}
            options={[
              { value: "", label: "I don't know my district" },
              ...districts.map((code) => ({ value: code, label: `District ${code}` })),
            ]}
          />
        ) : null}
        {state ? (
          <Button type="submit" size="lg" className="w-full" disabled={busy || loadingDistricts} data-testid="save-location">
            Continue
          </Button>
        ) : null}
        {state && districts.length > 1 && !district ? (
          <p className="text-xs text-muted-foreground">
            That still gets you your senators. Enter your address below to find your House rep too.
          </p>
        ) : null}
      </form>

      <form
        className="space-y-1"
        onSubmit={(event) => {
          event.preventDefault();
          choseManually.current = true;
          run({ address });
        }}
      >
        <Label htmlFor="location-address">Or enter your address</Label>
        <div className="flex gap-2">
          <Input
            id="location-address"
            value={address}
            autoComplete="street-address"
            placeholder="123 Main St, Austin, TX"
            onChange={(event) => setAddress(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={busy || address.trim().length < 5}>
            Find
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
