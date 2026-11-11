"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { CitySearch, type CityChoice } from "@/components/state/city-search";
import { Button } from "@/components/ui/button";
import { saveHomeCity } from "./home-city-button";

/**
 * For someone in a state we cover whose city we don't know: a lookup by coordinates finds it, but
 * choosing a state by hand doesn't. One search and a tap puts City Hall on their dashboard.
 */
export function FindHomeCity({ stateKey, stateName, citiesHref }: { stateKey: string; stateName: string; citiesHref: string }) {
  const router = useRouter();
  const [city, setCity] = useState<CityChoice | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!city) return;
    setSaving(true);
    try {
      await saveHomeCity(city.key);
      toast.success(`${city.name} is your city now.`);
      router.refresh();
    } catch (failure) {
      toast.error((failure as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-b-4 bg-card p-4" data-testid="find-home-city">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-0.5">
          <p className="font-extrabold">Which city do you live in?</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll show you your mayor, when the council meets, and how to speak at it. We have all of {stateName}&apos;s cities.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <CitySearch stateKey={stateKey} value={city} onChange={setCity} placeholder="Find your city" />
        </div>
        <Button onClick={save} disabled={!city || saving} data-testid="find-home-city-save">
          {saving ? "Saving…" : "That's mine"}
        </Button>
      </div>
      <Link href={citiesHref} className="tap inline-block text-sm font-bold text-primary hover:underline">
        Or browse every city
      </Link>
    </div>
  );
}
