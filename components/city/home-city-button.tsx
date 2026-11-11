"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";

/** Saves the city someone lives in, which puts City Hall on their dashboard. */
export async function saveHomeCity(city: string | null): Promise<void> {
  const response = await fetch("/api/civic/location/home-city", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "That didn't save. Please try again.");
}

/** "I live here", on a city's page, for someone in that state who hasn't said so. */
export function HomeCityButton({ cityKey, cityName, signedIn }: { cityKey: string; cityName: string; signedIn: boolean }) {
  const router = useRouter();
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!signedIn) return openLogin(true);
    setSaving(true);
    try {
      await saveHomeCity(cityKey);
      toast.success(`${cityName} is your city now. Its meetings will show on your dashboard.`);
      router.refresh();
    } catch (failure) {
      toast.error((failure as Error).message);
      setSaving(false);
    }
  };

  return (
    <Button variant="outline" onClick={save} disabled={saving} data-testid="home-city-save">
      <Home className="size-4" aria-hidden />
      {saving ? "Saving…" : "I live here"}
    </Button>
  );
}
