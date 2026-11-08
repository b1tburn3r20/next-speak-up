import Link from "next/link";
import { CalendarPlus, ExternalLink, FileText, MapPin, Mic } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { CityMeeting } from "@/lib/civic/city";
import { agendaPostsAt, speakWindow } from "@/lib/civic/city-logic";
import type { CityConfig } from "@/lib/civic/states";
import { eventPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

function when(date: Date, timeZone: string, withTime = true): string {
  const day = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone });
  if (!withTime) return day;
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone }).replace(":00", "");
  return `${day} at ${time}`;
}

/** The next City Hall meeting: when, where, how to speak, and when the agenda goes up. */
export function NextMeetingCard({
  city,
  stateKey,
  meeting,
  timeZone,
  now = new Date(),
}: {
  city: CityConfig;
  stateKey: string;
  meeting: CityMeeting;
  timeZone: string;
  now?: Date;
}) {
  const window = speakWindow(meeting.startsAt, city, timeZone, now);
  const agendaAt = agendaPostsAt(meeting.startsAt, city, timeZone);
  const rule = city.requestToSpeak;
  return (
    <div className="space-y-4 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4 sm:p-5" data-testid="next-meeting">
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{city.council.name} meets next</p>
        <h2 className="break-words text-2xl font-extrabold leading-tight" data-testid="next-meeting-when">
          {when(meeting.startsAt, timeZone, meeting.hasTime)}
        </h2>
        {meeting.location ? (
          <p className="flex items-start gap-1.5 break-words">
            <MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            {meeting.location}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl bg-card p-3" data-testid="speak-window" data-status={window.status}>
        <p className="flex items-center gap-1.5 font-extrabold">
          <Mic className="size-4 shrink-0 text-primary" aria-hidden />
          {window.status === "OPEN"
            ? `You can ask to speak until ${when(window.closesAt, timeZone)}`
            : window.status === "NOT_YET"
              ? `Requests to speak open ${when(window.opensAt, timeZone, false)}`
              : "Requests to speak have closed for this meeting"}
        </p>
        <p className="text-sm text-muted-foreground">
          The city takes up to {rule.maxSpeakers} speakers at the end of each regular meeting, usually about {rule.minutesEach} minutes each.
          {window.status === "NOT_YET" ? ` They close ${when(window.closesAt, timeZone)}.` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={rule.url}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: window.status === "OPEN" ? "default" : "outline" }))}
            data-testid="request-to-speak"
          >
            <Mic className="size-4" aria-hidden />
            Request to speak
          </a>
          <a href={rule.rulesUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            <ExternalLink className="size-4" aria-hidden />
            The city&apos;s rules
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a href={`/api/civic/events/${meeting.id}/ics`} className={buttonVariants({ variant: "outline" })} data-testid="next-meeting-calendar">
          <CalendarPlus className="size-4" aria-hidden />
          Add to my calendar
        </a>
        <Link href={eventPath(stateKey, meeting.id)} className="tap text-sm font-bold text-primary hover:underline">
          Details, and say you went
        </Link>
      </div>
      <p className="flex items-start gap-1.5 text-sm" data-testid="agenda-note">
        <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {meeting.documentUrl ? (
          <a href={meeting.documentUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
            Read the agenda
          </a>
        ) : (
          <span>
            {agendaAt > now ? `The agenda goes up by ${when(agendaAt, timeZone)}, ` : "The agenda should be up now, "}
            <a href={city.meetingsUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
              on the city&apos;s meetings page
            </a>
            .
          </span>
        )}
      </p>
    </div>
  );
}
