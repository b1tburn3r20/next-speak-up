import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Book, Briefcase, Building2, CalendarDays, type LucideIcon } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCards } from "@/components/bills/bill-cards";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { NextBillCard } from "@/components/civic/next-bill-card";
import { EventCard } from "@/components/state/event-card";
import { IowaSessionNote } from "@/components/state/session-note";
import { StateSeatPicker } from "@/components/state/state-seat-picker";
import { StateSeats } from "@/components/state/state-seats";
import { listBills } from "@/lib/civic/bills";
import { getIowaVoteQueue, getRepRecaps } from "@/lib/civic/engage";
import { getIowaCounts, IOWA_CODE, listEvents } from "@/lib/civic/state";
import { getUserMetrics } from "@/lib/civic/users";
import { stateRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Iowa",
  description: "Iowa's legislators, bills, and meetings, and whether your legislators vote the way you would.",
};

function PlaceLink({ href, icon: Icon, title, detail, testId }: { href: string; icon: LucideIcon; title: string; detail: string; testId: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted" data-testid={testId}>
      <Icon className="size-6 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export default async function IowaHubPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const now = new Date();
  const metrics = userId ? await getUserMetrics(userId) : null;
  const isIowan = metrics?.location?.regionCode === "IA";
  const seats = metrics?.stateSeats ?? [];
  const reps = seats.flatMap((seat) => (seat.member ? [seat.member] : []));
  const seatsKnown = seats.some((seat) => seat.code);
  const [counts, queue, laws, upcoming, recent, recaps] = await Promise.all([
    getIowaCounts(),
    getIowaVoteQueue(userId, reps.map((rep) => rep.id), 1),
    listBills({ jurisdiction: IOWA_CODE, status: "SIGNED", limit: 3 }),
    listEvents([IOWA_CODE, "US-IA-DSM"], { when: "upcoming", take: 4 }, now),
    listEvents([IOWA_CODE, "US-IA-DSM"], { when: "past", take: 3 }, now),
    getRepRecaps(reps, now),
  ]);
  const nextBill = queue[0];

  return (
    <PageSpacer>
      <PageHeader
        title={isIowan ? "Your Iowa" : "Iowa"}
        description="The people who vote for you at the statehouse, what they've decided, and where you can show up."
      />
      <IowaSessionNote detail />

      {isIowan ? (
        <Section title="Your legislators" description="Each one's score is separate, and only your own votes decide it." data-testid="iowa-yours">
          <Stack>
            {seatsKnown ? <StateSeats seats={seats} recaps={recaps} /> : null}
            {!seatsKnown || metrics?.stateLocation === null ? (
              <OuterBlock className="space-y-3">
                <p className="text-sm">
                  We only know you&apos;re in Iowa. Look up your address from{" "}
                  <Link href="/onboarding" className="font-bold text-primary hover:underline">
                    your location
                  </Link>
                  , or choose your districts here if you know them.
                </p>
                <StateSeatPicker initialLower={null} initialUpper={null} initialInDesMoines={false} />
              </OuterBlock>
            ) : null}
          </Stack>
        </Section>
      ) : (
        <OuterBlock className="space-y-2" data-testid="iowa-not-located">
          <h2 className="text-lg font-extrabold">Live in Iowa?</h2>
          <p className="text-sm">
            {userId
              ? "Set your location to Iowa, and we'll find your state legislators."
              : "Sign in and share your location, and we'll find your state legislators."}{" "}
            <Link href="/onboarding" className="font-bold text-primary hover:underline">
              Set your location
            </Link>
          </p>
        </OuterBlock>
      )}

      {nextBill ? (
        <Section title="Weigh in" description="Vote first, then see if your legislators agree with you." data-testid="iowa-next">
          <NextBillCard item={nextBill} />
        </Section>
      ) : null}

      <Grid cols="halves">
        <PlaceLink href={stateRoutes.bills} icon={Book} title="Bills" detail={`${counts.bills.toLocaleString()} from the 91st General Assembly, ${counts.laws.toLocaleString()} signed into law`} testId="iowa-link-bills" />
        <PlaceLink href={stateRoutes.legislators} icon={Briefcase} title="Legislators" detail={`${counts.members} sitting now, out of 150 seats`} testId="iowa-link-legislators" />
        <PlaceLink href={stateRoutes.events} icon={CalendarDays} title="Meetings" detail="Where to show up, and what happened" testId="iowa-link-events" />
        <PlaceLink href={stateRoutes.city} icon={Building2} title="Des Moines" detail="City Council meetings and agendas" testId="iowa-link-city" />
      </Grid>

      <Section title="Show up" action={{ href: stateRoutes.events, label: "All meetings" }} data-testid="iowa-show-up">
        {upcoming.events.length > 0 ? (
          <Stack>
            {upcoming.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
        ) : (
          <Stack>
            <OuterBlock data-testid="iowa-no-upcoming">
              <p className="font-extrabold">No meetings are posted right now</p>
              <p className="text-sm text-muted-foreground">
                Committee meetings get posted once the session starts, usually only days ahead. They&apos;ll show up here. These are the latest ones.
              </p>
            </OuterBlock>
            {recent.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
        )}
      </Section>

      {laws.bills.length > 0 ? (
        <Section title="Recently signed into law" action={{ href: `${stateRoutes.bills}?status=SIGNED`, label: "All of them" }} data-testid="iowa-laws">
          <Stack>
            <BillCards bills={laws.bills} />
          </Stack>
        </Section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Voter registration and polling places are run by the{" "}
        <a href="https://sos.iowa.gov" target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
          Iowa Secretary of State
        </a>
        . Coolbills never rewards voting in an election, or how anyone votes.
      </p>
    </PageSpacer>
  );
}
