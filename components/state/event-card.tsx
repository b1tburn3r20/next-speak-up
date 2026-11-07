import Link from "next/link";
import { Ban, CalendarDays, FileText, MapPin } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import { EVENT_KIND_LABELS, type EventKind } from "@/lib/civic/state-logic";
import type { CivicEventRow } from "@/lib/civic/state";
import { eventPath } from "@/lib/routes";

/** Iowa's time, because that's where you'd have to be. A meeting with no time only names its day. */
export function eventWhen(event: { startsAt: Date; hasTime: boolean }): string {
  const day = event.startsAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: event.hasTime ? "America/Chicago" : "UTC",
  });
  if (!event.hasTime) return day;
  const time = event.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
  return `${day}, ${time}`;
}

export function EventCard({ event }: { event: CivicEventRow }) {
  const canceled = event.status === "CANCELED";
  return (
    <OuterBlock className="space-y-1.5" data-testid="event-card" data-status={event.status}>
      <p className="flex flex-wrap items-center gap-x-2 text-xs font-extrabold text-muted-foreground">
        {EVENT_KIND_LABELS[event.kind as EventKind]}
        {canceled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-oppose-tint px-2 py-0.5 text-oppose" data-testid="event-canceled">
            <Ban className="size-3" aria-hidden />
            Canceled
          </span>
        ) : null}
      </p>
      <h3 className="break-words font-extrabold leading-snug">
        <Link href={eventPath(event.id)} className="hover:underline">
          {event.title}
        </Link>
      </h3>
      <p className="flex items-center gap-1.5 text-sm">
        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
        {eventWhen(event)}
      </p>
      {event.location ? (
        <p className="flex items-center gap-1.5 break-words text-sm">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          {event.location}
        </p>
      ) : null}
      {event.items.length > 0 ? (
        <p className="break-words text-sm text-muted-foreground">
          On the agenda: {event.items.slice(0, 6).map((item) => item.title).join(", ")}
          {event.items.length > 6 ? `, and ${event.items.length - 6} more` : ""}
        </p>
      ) : null}
      {event.documentUrl ? (
        <a href={event.documentUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          <FileText className="size-4" aria-hidden />
          Agenda (PDF)
        </a>
      ) : null}
    </OuterBlock>
  );
}
