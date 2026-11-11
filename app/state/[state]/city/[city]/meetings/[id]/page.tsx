import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { CalendarPlus, CheckCircle2, ExternalLink, FileText, MapPin, Mic, PlayCircle } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { DetailEventSkeleton } from "@/components/app/skeletons";
import { OuterBlock, PageSpacer, Section, WithRail } from "@/components/blocks";
import { RemindMeButton } from "@/components/notifications/remind-me-button";
import { AttendButton } from "@/components/state/attend-button";
import { eventWhen } from "@/components/state/event-card";
import { buttonVariants } from "@/components/ui/button";
import { getCityMeeting } from "@/lib/civic/city";
import { ADOPTED_SECTION, groupTopics } from "@/lib/civic/city-logic";
import { getCityContext } from "@/lib/civic/city-registry";
import { getStateLocation, hasReportedAttending } from "@/lib/civic/state";
import { canReportAttendance } from "@/lib/civic/state-logic";
import { stateByKey } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

type PageProps = { params: Promise<{ state: string; city: string; id: string }> };

async function meetingFrom(params: PageProps["params"]) {
  const { state: stateKey, city: cityKey, id: raw } = await params;
  const id = Number(raw);
  const state = stateByKey(stateKey);
  const city = state ? await getCityContext(state, cityKey) : null;
  if (!state || !city || !Number.isInteger(id) || id <= 0) return null;
  const meeting = await getCityMeeting(city, id);
  return meeting ? { state, city, meeting } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = await meetingFrom(params);
  return { title: found ? `${found.meeting.title}, ${found.city.name}` : "Meeting not found" };
}

async function MeetingBody({ params }: PageProps) {
  const found = await meetingFrom(params);
  if (!found) notFound();
  const { state, city, meeting } = found;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const [reported, location] = userId
    ? await Promise.all([hasReportedAttending(userId, meeting.id), getStateLocation(userId, state)])
    : [false, null];
  const now = new Date();
  const isPast = meeting.startsAt.getTime() < now.getTime();
  const canceled = meeting.status === "CANCELED";
  const canReport = canReportAttendance(meeting, now);
  const topics = groupTopics(meeting.items);
  const passed = meeting.items.filter((item) => item.section === ADOPTED_SECTION);
  const speakUrl = city.config?.requestToSpeak.url ?? city.profile?.speakUrl ?? null;
  const cityHref = stateRoutes(state.key).city(city.key);

  return (
    <PageSpacer>
      <header className="space-y-1">
        <Link href={cityHref} className="text-sm font-bold text-primary hover:underline">
          ← City Hall: {city.name}
        </Link>
        <p className="text-sm font-extrabold text-muted-foreground">{city.config?.council.name ?? "City Council"}</p>
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="meeting-title">
          {meeting.title}
        </h1>
        <p className="font-bold" data-testid="meeting-when">{eventWhen(meeting, state.timeZone)}</p>
        {!meeting.hasTime ? <p className="text-sm text-muted-foreground">The city only gives the day here, so check the agenda for the time.</p> : null}
      </header>
      {canceled ? <p className="rounded-xl bg-oppose-tint p-3 font-extrabold">This meeting was canceled.</p> : null}

      <WithRail
        rail={
          <OuterBlock className="space-y-3" data-testid="meeting-actions">
            <h2 className="text-lg font-extrabold">{isPast ? "Were you there?" : "Go to it"}</h2>
            {meeting.location ? (
              <p className="flex items-start gap-1.5 break-words">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {meeting.location}
              </p>
            ) : null}
            {!isPast && !canceled ? (
              <>
                <RemindMeButton cityKey={city.key} cityName={city.name} livesHere={location?.city?.key === city.key} signedIn={Boolean(userId)} className="w-full" />
                <a href={`/api/civic/events/${meeting.id}/ics`} className={buttonVariants({ variant: "outline" })} data-testid="meeting-calendar">
                  <CalendarPlus className="size-4" aria-hidden />
                  Add to my calendar
                </a>
                {speakUrl ? (
                  <a href={speakUrl} target="_blank" rel="noreferrer" className={buttonVariants()} data-testid="meeting-speak">
                    <Mic className="size-4" aria-hidden />
                    How to speak at it
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">The agenda says when the council takes public comment. You can also call City Hall to ask.</p>
                )}
              </>
            ) : null}
            {canReport ? (
              <AttendButton eventId={meeting.id} signedIn={Boolean(userId)} initialReported={reported} />
            ) : reported ? (
              <p className="font-extrabold text-support" data-testid="attend-done">You said you went. Thanks for showing up.</p>
            ) : isPast ? (
              <p className="text-sm text-muted-foreground">{canceled ? "It was canceled." : "It's been more than two weeks, so this can't be reported any more."}</p>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="attend-not-yet">Once it starts, you can tell us you went, and earn 50 XP.</p>
            )}
          </OuterBlock>
        }
      >
        {topics.length > 0 ? (
          <Section title="On the agenda" description="In the agenda's own words." data-testid="meeting-topics">
            <OuterBlock className="space-y-3">
              {topics.map((group) => (
                <ul key={group.section} className="list-disc space-y-1 pl-5">
                  {group.items.map((item) => (
                    <li key={item.id} className="break-words">{item.title}</li>
                  ))}
                </ul>
              ))}
            </OuterBlock>
          </Section>
        ) : null}

        {passed.length > 0 ? (
          <Section title="What passed" description="Resolutions and ordinances the minutes say carried, each with its own motion." data-testid="meeting-passed">
            <OuterBlock>
              <ul className="space-y-2">
                {passed.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 break-words">{item.title}</span>
                  </li>
                ))}
              </ul>
            </OuterBlock>
          </Section>
        ) : null}

        {topics.length === 0 && passed.length === 0 ? (
          <EmptyState title={isPast ? "We couldn't read this meeting's papers" : "The agenda isn't out yet"}>
            {isPast ? "The city's own agenda and minutes are linked below, when it posted them." : "Cities usually post an agenda a few days before a meeting. Check back then."}
          </EmptyState>
        ) : null}

        {meeting.documentUrl || meeting.minutesUrl || meeting.videoUrl ? (
          <Section title="From the city" data-testid="meeting-documents">
            <OuterBlock className="flex flex-wrap gap-x-5 gap-y-2">
              {meeting.documentUrl ? (
                <a href={meeting.documentUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
                  <FileText className="size-4" aria-hidden />
                  Agenda
                </a>
              ) : null}
              {meeting.minutesUrl ? (
                <a href={meeting.minutesUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
                  <FileText className="size-4" aria-hidden />
                  Minutes
                </a>
              ) : null}
              {meeting.videoUrl ? (
                <a href={meeting.videoUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
                  <PlayCircle className="size-4" aria-hidden />
                  Watch it
                </a>
              ) : null}
              {meeting.sourceUrl ? (
                <a href={meeting.sourceUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
                  <ExternalLink className="size-4" aria-hidden />
                  Where we found it
                </a>
              ) : null}
            </OuterBlock>
          </Section>
        ) : null}
      </WithRail>
    </PageSpacer>
  );
}

export default async function CityMeetingPage(props: PageProps) {
  if (!(await meetingFrom(props.params))) notFound();
  return (
    <Suspense fallback={<DetailEventSkeleton />}>
      <MeetingBody {...props} />
    </Suspense>
  );
}
