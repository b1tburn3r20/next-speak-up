import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { IOWA_NEXT_SESSION, iowaSessionHasStarted } from "@/lib/civic/government";
import { stateRoutes } from "@/lib/routes";

const WHEN = IOWA_NEXT_SESSION.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" });

/** Why Iowa's lists are quiet, so an empty calendar doesn't look like something's broken. */
export function IowaSessionNote({ detail = false }: { detail?: boolean }) {
  const inSession = iowaSessionHasStarted();
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4" data-testid="iowa-session-note">
      <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-extrabold">
          {inSession ? "A new General Assembly has started" : `The Iowa Legislature is out until ${WHEN}`}{" "}
          {!detail ? (
            <Link href={stateRoutes.home} className="whitespace-nowrap font-bold text-primary hover:underline">
              See Iowa
            </Link>
          ) : null}
        </p>
        {detail ? (
          <p className="text-sm">
            {inSession
              ? "We haven't loaded its bills yet. What's here is from the 91st General Assembly."
              : `Bills from the 91st General Assembly that didn't pass are finished, and would have to be filed again. You can still vote on them to see whether your legislators vote the way you would. People elected on November 3 haven't taken their seats, so the legislators listed here are the ones sitting now.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
