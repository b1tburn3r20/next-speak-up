import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { nextSessionText, sessionHasStarted, type StateConfig } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

/** Why a state's lists are quiet, so an empty calendar doesn't look like something's broken. */
export function StateSessionNote({ state, detail = false, link = !detail }: { state: StateConfig; detail?: boolean; link?: boolean }) {
  const started = sessionHasStarted(state);
  const legislature = state.legislature.charAt(0).toUpperCase() + state.legislature.slice(1);
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4" data-testid="state-session-note">
      <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-extrabold">
          {started ? `${legislature} has started a new session` : `${legislature} is out until ${nextSessionText(state)}`}{" "}
          {link ? (
            <Link href={stateRoutes(state.key).home} className="whitespace-nowrap font-bold text-primary hover:underline">
              See {state.name}
            </Link>
          ) : null}
        </p>
        {detail ? (
          <p className="text-sm">
            {started
              ? "We haven't loaded its bills yet. What's here is from the last session."
              : "Bills from the last session that didn't pass are finished, and would have to be filed again. You can still vote on them to see whether your legislators vote the way you would. Anyone just elected hasn't taken their seat, so the legislators listed here are the ones sitting now."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
