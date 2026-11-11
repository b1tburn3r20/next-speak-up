import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, ExternalLink, Landmark, MapPin, Mic, Phone } from "lucide-react";
import { RemindMeButton } from "@/components/notifications/remind-me-button";
import { MemberPhoto } from "@/components/people/member-photo";
import { eventWhen } from "@/components/state/event-card";
import { buttonVariants } from "@/components/ui/button";
import type { CityMeeting, CityOfficial } from "@/lib/civic/city";
import { primaryCityAction, telHref, type ScheduledMeeting } from "@/lib/civic/city-logic";
import type { CityContext } from "@/lib/civic/city-registry";
import type { StateConfig } from "@/lib/civic/states";
import { cityMeetingPath } from "@/lib/routes";

/**
 * A city's first screen in one card: when the council meets next, the one thing to do about it, who the
 * mayor is, and how to reach City Hall. Everything else on the page goes deeper.
 */
export function CityGlanceCard({
  state,
  city,
  mayor,
  mayorHref,
  next,
  scheduled,
  hosted,
  agendaHref,
  lastPosted,
  livesHere,
  signedIn,
}: {
  state: StateConfig;
  city: CityContext;
  mayor: CityOfficial | undefined;
  mayorHref?: string;
  next: CityMeeting | null;
  scheduled: ScheduledMeeting | null;
  /** The name of a hosted agenda system we can't read, if the city uses one. */
  hosted: string | undefined;
  agendaHref: string | null;
  /** The newest meeting we have, when there's no upcoming one and it's months old. */
  lastPosted: Date | null;
  livesHere: boolean;
  signedIn: boolean;
}) {
  const profile = city.profile;
  const action = primaryCityAction({ speakUrl: profile?.speakUrl, meetingKnown: Boolean(next || scheduled), phone: profile?.phone, agendaUrl: agendaHref });
  const remind = <RemindMeButton cityKey={city.key} cityName={city.name} livesHere={livesHere} signedIn={signedIn} className="w-full sm:w-auto" />;

  return (
    <section className="space-y-4 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4 sm:p-5" data-testid="next-meeting">
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">City Council</p>
        {next ? (
          <>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold leading-tight" data-testid="next-meeting-when">
              <CalendarDays className="size-6 shrink-0 text-primary" aria-hidden />
              {eventWhen(next, state.timeZone)}
            </h2>
            <p className="break-words text-sm">{next.title}</p>
          </>
        ) : scheduled ? (
          <div data-testid="scheduled-meeting">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold leading-tight" data-testid="next-meeting-when">
              <CalendarDays className="size-6 shrink-0 text-primary" aria-hidden />
              {scheduled.day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
              {scheduled.startsAt ? `, ${scheduled.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: state.timeZone })}` : ""}
            </h2>
            <p className="text-sm">
              Its regular schedule ({profile?.meetingSchedule}). A holiday can move it, so check with City Hall.
            </p>
          </div>
        ) : hosted && agendaHref ? (
          <p className="text-sm" data-testid="no-next-meeting">
            {city.name} posts its meetings on {hosted}, which we can&apos;t read yet. The city&apos;s page has every one.
          </p>
        ) : lastPosted ? (
          <p className="text-sm" data-testid="no-next-meeting">
            The newest meeting we have is from{" "}
            {lastPosted.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: state.timeZone })}. The city may post them
            somewhere else now.
          </p>
        ) : (
          <p className="text-sm" data-testid="no-next-meeting">
            {agendaHref ? "No meeting is posted yet. Cities usually post an agenda a few days ahead." : "We don't know where the city posts its agendas."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" data-testid="city-actions">
        {action.kind === "SPEAK" ? (
          <a href={action.href} target="_blank" rel="noreferrer" className={buttonVariants({ className: "w-full sm:w-auto" })} data-testid="speak-link">
            <Mic className="size-4" aria-hidden />
            Sign up to speak
          </a>
        ) : action.kind === "REMIND" ? (
          remind
        ) : action.kind === "CALL" ? (
          <a href={action.href} className={buttonVariants({ className: "w-full sm:w-auto" })} data-testid="call-city-hall">
            <Phone className="size-4" aria-hidden />
            Call City Hall
          </a>
        ) : action.kind === "AGENDA" ? (
          <a href={action.href} target="_blank" rel="noreferrer" className={buttonVariants({ className: "w-full sm:w-auto" })} data-testid="hosted-meetings-link">
            <ExternalLink className="size-4" aria-hidden />
            {hosted ? `Meetings, on ${hosted}` : "Agendas on the city's site"}
          </a>
        ) : null}
        {action.kind === "SPEAK" && (next || scheduled) ? remind : null}
        {next ? (
          <>
            <Link href={cityMeetingPath(state.key, city.key, next.id)} className={buttonVariants({ variant: "outline" })} data-testid="next-meeting-details">
              What&apos;s on it
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a href={`/api/civic/events/${next.id}/ics`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Add to my calendar" data-testid="next-meeting-calendar">
              <CalendarPlus className="size-4" aria-hidden />
            </a>
          </>
        ) : null}
      </div>

      <p className="flex items-start gap-1.5 text-sm" data-testid="speak">
        <Mic className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {profile?.speakUrl ? (
          <span>The city takes sign-ups to speak on its site.</span>
        ) : profile?.speakInfo ? (
          <span data-testid="speak-info">{profile.speakInfo}</span>
        ) : (
          <span className="text-muted-foreground" data-testid="no-speak-link">
            To speak, check the agenda for public comment{profile?.phone ? ", or call City Hall" : ""}.
          </span>
        )}
      </p>

      <div className="grid gap-3 border-t-2 border-primary/20 pt-4 sm:grid-cols-2">
        {mayor ? (
          <div className="flex min-w-0 items-center gap-3" data-testid="city-official" data-seat="Mayor">
            <MemberPhoto name={mayor.fullName} url={mayor.imageUrl} party={null} size={48} />
            <span className="min-w-0">
              <span className="block break-words font-extrabold leading-snug" data-testid="city-official-name">
                {mayorHref ? (
                  <Link href={mayorHref} className="hover:underline">
                    {mayor.fullName}
                  </Link>
                ) : (
                  mayor.fullName
                )}
              </span>
              <span className="block text-sm text-muted-foreground">Mayor of {city.name}</span>
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="no-mayor">
            {profile?.website ? "We couldn't read the mayor's name from the city's site." : "We don't know who the mayor is yet."}
          </p>
        )}
        <div className="min-w-0 space-y-1" data-testid="city-hall">
          <p className="flex items-center gap-1.5 text-sm font-extrabold">
            <Landmark className="size-4 shrink-0 text-primary" aria-hidden />
            City Hall
          </p>
          {profile?.phone || profile?.address ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {profile.phone ? (
                <a href={telHref(profile.phone)} className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline" data-testid="city-hall-phone">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {profile.phone}
                </a>
              ) : null}
              {profile.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tap inline-flex min-w-0 items-start gap-1.5 font-bold text-primary hover:underline"
                  data-testid="city-hall-address"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words">{profile.address}</span>
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="no-city-hall">
              We don&apos;t have City Hall&apos;s address or phone yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
