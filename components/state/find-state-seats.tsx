"use client";

import { useRouter } from "next/navigation";
import { LocationPicker } from "@/components/onboarding/location-picker";
import { Disclosure } from "@/components/ui/disclosure";
import { chamberName, type ClientState } from "@/lib/civic/states";
import { StateSeatPicker } from "./state-seat-picker";

/**
 * For people we only have a congressional district for. That can't tell us their statehouse seats,
 * because one congressional district holds many, and we never keep an address. So it asks once more,
 * right here, and the lookup saves both seats.
 */
export function FindStateSeats({ state }: { state: ClientState }) {
  const router = useRouter();
  return (
    <div className="space-y-4" data-testid="find-state-seats">
      <div className="space-y-1">
        <p className="font-extrabold">
          Find your {chamberName(state, "LOWER")} and {state.chambers.UPPER.name} districts
        </p>
        <p className="text-sm text-muted-foreground">
          Your congressional district covers many of them, so we need your location once more. Like before, it&apos;s only
          used for the lookup, and only the district numbers are saved.
        </p>
      </div>
      <LocationPicker onResolved={() => router.refresh()} />
      <Disclosure title="I know my districts" data-testid="know-my-districts">
        <div className="mt-3">
          <StateSeatPicker state={state} initialLower={null} initialUpper={null} initialCity={null} />
        </div>
      </Disclosure>
    </div>
  );
}
