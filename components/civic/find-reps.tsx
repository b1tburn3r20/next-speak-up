"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useTransition } from "react";
import { LocationPicker } from "@/components/onboarding/location-picker";
import { useCivicStore } from "@/stores/use-civic-store";

/** Finding your reps happens right here, instead of sending people off to Settings. */
export function FindReps() {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const loadPulseCount = useCivicStore((state) => state.loadPulseCount);
  return (
    <div className="space-y-3 rounded-2xl border-2 border-b-4 border-primary bg-card p-4 sm:p-5" data-testid="find-reps" id="find-reps">
      <div className="flex items-center gap-2">
        <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
        <h2 className="text-lg font-extrabold">Find your representatives</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        We only use this to find your district. Your exact location isn&apos;t saved.
      </p>
      <LocationPicker
        onResolved={() => {
          loadPulseCount(true);
          startRefresh(() => router.refresh());
        }}
      />
      {refreshing ? <p role="status" className="text-sm font-bold">Loading your reps</p> : null}
    </div>
  );
}
