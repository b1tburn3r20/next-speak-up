import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState } from "@/components/app/page-states";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
import { PageHeader, PageShell, Section, Stack } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { getFloorSchedule } from "@/lib/civic/floor";
import { groupFloorWeeks } from "@/lib/civic/floor-logic";
import { getUserBillStates } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Upcoming votes",
  description: "Bills the House may vote on soon, from the Majority Leader's floor schedule.",
};

export default async function UpcomingBillsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const now = new Date();
  const items = await getFloorSchedule(now);
  const billIds = items.flatMap((item) => (item.bill ? [item.bill.id] : []));
  const states = userId ? await getUserBillStates(userId, billIds) : new Map();
  const weeks = groupFloorWeeks(items, now);
  const hasUpcoming = weeks.some((week) => week.position === "THIS" || week.position === "NEXT");
  const asOf = items.reduce<Date | null>(
    (latest, item) => (!latest || item.asOf > latest ? item.asOf : latest),
    null,
  );

  return (
    <PageShell>
      <PageHeader
        back={{ href: "/bills", label: "All bills" }}
        title="Upcoming votes"
        description="What the House may vote on next. Weigh in before your representative does."
      />

      {!hasUpcoming ? (
        <EmptyState title="Nothing on the House schedule right now" action={{ href: "/vote", label: "Vote on recent bills instead" }}>
          The House may be out of session. A new schedule usually appears before the next week starts.
        </EmptyState>
      ) : null}

      {weeks.map((week) => (
        <Section
          key={week.weekOf.toISOString()}
          title={week.label}
          description={`${week.items.length} item${week.items.length === 1 ? "" : "s"}`}
          data-testid="floor-week"
        >
          <Stack>
            {week.items.map((item) => (
              <UpcomingBillCard
                key={item.id}
                item={item}
                signedIn={Boolean(userId)}
                state={item.bill ? states.get(item.bill.id) : undefined}
              />
            ))}
          </Stack>
        </Section>
      ))}

      <p className="text-sm text-muted-foreground">
        Being listed doesn&apos;t guarantee a vote, and the schedule can change during the week. The
        Senate doesn&apos;t publish its schedule this way.
      </p>
      {asOf ? <AsOfNote date={asOf} label="From docs.house.gov. Fetched" /> : null}

      <NextStepCard
        label="When you're done here"
        step={{
          id: "after-upcoming",
          title: "Now see what your reps already voted on",
          description: "Vote first, then find out if you match.",
          href: "/vote",
          cta: "Start voting",
          tone: "primary",
        }}
      />
    </PageShell>
  );
}
