"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATE_NAMES } from "@/lib/constants/state-names";

export type ResolvedLocation = { regionCode: string; districtCode: string };

const STATES = Object.entries(STATE_NAMES as Record<string, string>).sort((a, b) =>
  a[1].localeCompare(b[1]),
);

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

/** Tries the easiest option first, and always leaves a way forward if one fails. */
export function LocationPicker({ onResolved }: { onResolved: (location: ResolvedLocation) => void }) {
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const useBrowserLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share a location. Enter an address instead.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => run({ lat: coords.latitude, lng: coords.longitude }),
      () => {
        setBusy(false);
        setError("We couldn't get your location. Enter an address instead.");
      },
      { timeout: 10000 },
    );
  };

  const chooseState = async (value: string) => {
    setState(value);
    setDistrict("");
    setDistricts([]);
    if (!value) return;
    const response = await fetch(`/api/civic/location/districts?state=${value}`);
    const data = await response.json().catch(() => null);
    const found: string[] = data?.districts ?? [];
    setDistricts(found);
    if (found.length === 1) setDistrict(found[0]);
  };

  const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

  return (
    <div className="space-y-4 font-normal">
      <Button
        type="button"
        className="w-full"
        onClick={useBrowserLocation}
        disabled={busy}
        data-testid="use-my-location"
      >
        <LocateFixed className="size-4" />
        {busy ? "Looking…" : "Use my location"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We only use this to find your district, and we don&apos;t store your location or address.
      </p>

      <form
        className="space-y-1"
        onSubmit={(event) => {
          event.preventDefault();
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
          <Button type="submit" variant="outline" disabled={busy || address.trim().length < 5}>
            Find
          </Button>
        </div>
      </form>

      <form
        className="space-y-1"
        onSubmit={(event) => {
          event.preventDefault();
          run({ regionCode: state, districtCode: district });
        }}
      >
        <Label htmlFor="location-state">Or choose it yourself</Label>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <select
            id="location-state"
            className={selectClass}
            value={state}
            onChange={(event) => chooseState(event.target.value)}
          >
            <option value="">State</option>
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="District"
            className={selectClass}
            value={district}
            disabled={districts.length === 0}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option value="">District</option>
            {districts.map((code) => (
              <option key={code} value={code}>
                {code === "AL" ? "At large" : code}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" disabled={busy || !state || !district}>
            Save
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
