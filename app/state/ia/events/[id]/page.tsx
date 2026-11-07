import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { CalendarPlus, ExternalLink, FileText, MapPin, Video } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DetailEventSkeleton } from "@/components/app/skeletons";
import { OuterBlock, PageSpacer, Section, WithRail } from "@/components/blocks";
import { AttendButton } from "@/components/state/attend-button";
import { eventWhen } from "@/components/state/event-card";
import { buttonVariants } from "@/components/ui/button";
import { existingBills } from "@/lib/civic/bills";
import { canReportAttendance, EVENT_KIND_LABELS, howToTakePart, type EventKind } from "@/lib/civic/state-logic";
import { getEvent, hasReportedAttending } from "@/lib/civic/state";
import { billPath, stateRoutes } from "@/lib/routes";

type PageProps = { params: Promise<{ id: string }> };

function eventId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = eventId((await params).id);
  const event = id ? await getEvent(id) : null;
  return { title: event?.title ?? "Meeting not found" };
}

/** "HF 100" becomes the bill's slug, when it's a bill we have. Study bills usually aren't. */
function itemSlug(title: string): string | null {
  const match = title.match(/^([A-Z]+) (\d+)$/);
  return match ? `ia-91-${match[1].toLowerCase()}-${match[2]}` : null;
}

async function EventBody({ params }: PageProps) {
  const id = eventId((await params).id);
  const event = id ? await getEvent(id) : null;
  if (!event) notFound();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const now = new Date();
  const [known, reported] = await Promise.all([
    existingBills(event.items.flatMap((item) => itemSlug(item.title) ?? [])),
    userId ? hasReportedAttending(userId, event.id) : Promise.resolve(false),
  ]);
  const canceled = event.status === "CANCELED";
  const isPast = event.startsAt.getTime() < now.getTime();
  const canReport = canReportAttendance(event, now);
  const kind = event.kind as EventKind;

  return (
    <PageSpacer>
      <header className="space-y-1">
        <Link href={stateRoutes.events} className="text-sm font-bold text-primary hover:underline">
          ← All meetings
        </Link>
        <p className="text-sm font-extrabold text-muted-foreground">
          {EVENT_KIND_LABELS[kind]} · {event.jurisdiction.name}
        </p>
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="event-title">
          {event.title}
        </h1>
        <p className="font-bold" data-testid="event-when">{eventWhen(event)}</p>
        {!event.hasTime ? (
          <p className="text-sm text-muted-foreground">The agenda&apos;s file name only gives the day, so check the agenda for the time.</p>
        ) : null}
      </header>
      {canceled ? (
        <p className="rounded-xl bg-oppose-tint p-3 font-extrabold" data-testid="event-canceled-note">This meeting was canceled.</p>
      ) : null}

      <WithRail
        rail={
          <OuterBlock className="space-y-3" data-testid="event-actions">
            <h2 className="text-lg font-extrabold">{isPast ? "Were you there?" : "Go to it"}</h2>
            {event.location ? (
              <p className="flex items-start gap-1.5 break-words">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {event.location}
              </p>
            ) : null}
            {!isPast && event.joinUrl ? (
              <a href={event.joinUrl} target="_blank" rel="noreferrer" className="tap flex items-center gap-1.5 font-bold text-primary hover:underline" data-testid="event-join">
                <Video className="size-4" aria-hidden />
                Join online
              </a>
            ) : null}
            {!isPast && !canceled ? (
              <a href={`/api/civic/events/${event.id}/ics`} className={buttonVariants({ variant: "outline" })} data-testid="event-calendar">
                <CalendarPlus className="size-4" aria-hidden />
                Add to my calendar
              </a>
            ) : null}
            {canReport ? (
              <AttendButton eventId={event.id} signedIn={Boolean(userId)} initialReported={reported} />
            ) : reported ? (
              <p className="font-extrabold text-support" data-testid="attend-done">You said you went. Thanks for showing up.</p>
            ) : isPast ? (
              <p className="text-sm text-muted-foreground" data-testid="attend-closed">
                {canceled ? "It was canceled." : "It's been more than two weeks, so this can't be reported any more."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="attend-not-yet">Once it starts, you can tell us you went, and earn 50 XP.</p>
            )}
          </OuterBlock>
        }
      >
        <Section title="How to take part">
          <OuterBlock>
            <p>{howToTakePart(kind)}</p>
          </OuterBlock>
        </Section>
        {event.items.length > 0 ? (
          <Section title="Bills on the agenda" data-testid="event-items">
            <OuterBlock>
              <ul className="flex flex-wrap gap-2">
                {event.items.map((item) => {
                  const slug = itemSlug(item.title);
                  return (
                    <li key={item.id} className="rounded-full bg-muted px-3 py-1 text-sm font-bold">
                      {slug && known.has(slug) ? (
                        <Link href={billPath(slug)} className="text-primary hover:underline">
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </li>
                  );
                })}
              </ul>
            </OuterBlock>
          </Section>
        ) : null}
        {event.agenda ? (
          <Section title="What the notice says">
            <OuterBlock>
              <p className="whitespace-pre-wrap break-words text-sm">{event.agenda}</p>
            </OuterBlock>
          </Section>
        ) : null}
        <p className="flex flex-wrap gap-3 text-sm">
          {event.documentUrl ? (
            <a href={event.documentUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 font-bold text-primary hover:underline">
              <FileText className="size-4" aria-hidden />
              Agenda (PDF)
            </a>
          ) : null}
          {event.sourceUrl && event.sourceUrl !== event.documentUrl ? (
            <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="tap inline-flex items-center gap-1 font-bold text-primary hover:underline">
              <ExternalLink className="size-4" aria-hidden />
              Source
            </a>
          ) : null}
        </p>
      </WithRail>
    </PageSpacer>
  );
}

export default async function IowaEventPage(props: PageProps) {
  const id = eventId((await props.params).id);
  if (!id || !(await getEvent(id))) notFound();
  return (
    <Suspense fallback={<DetailEventSkeleton />}>
      <EventBody {...props} />
    </Suspense>
  );
}
