import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState } from "@/components/app/page-states";
import { ChamberColumn, RightNow } from "@/components/bills/floor-board";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
import { PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { floorBoardBillIds, getFloorBoard, getFloorSchedule } from "@/lib/civic/floor";
import { groupFloorWeeks } from "@/lib/civic/floor-logic";
import { getUserBillStates } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Upcoming votes",
  description: "What the House and Senate may take up soon, from what each chamber publishes.",
};

export default async function UpcomingBillsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const now = new Date();
  const [items, board] = await Promise.all([getFloorSchedule(now), getFloorBoard(now)]);
  const billIds = [...items.flatMap((item) => (item.bill ? [item.bill.id] : [])), ...floorBoardBillIds(board)];
  const states = userId ? await getUserBillStates(userId, billIds) : new Map();
  const weeks = groupFloorWeeks(items, now);
  const hasUpcoming = weeks.some((week) => week.position === "THIS" || week.position === "NEXT");
  const asOf = items.reduce<Date | null>(
    (latest, item) => (!latest || item.asOf > latest ? item.asOf : latest),
    null,
  );

  return (
    <PageSpacer>
      <PageHeader
        title="Upcoming votes"
        description="What Congress may take up next. Weigh in before your representatives do."
      />

      <RightNow board={board} />

      <h2 className="text-xl font-extrabold">House floor</h2>

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

      <ChamberColumn chamber="senate" data={board.senate} now={now} signedIn={Boolean(userId)} states={states} />

      <p className="text-sm text-muted-foreground">
        Being listed doesn&apos;t guarantee a vote, and plans can change during the week. The Senate
        doesn&apos;t publish a weekly list like the House does, so its side shows what its Calendar
        and Daily Digest say, which is usually only a few items.
      </p>
      {(board.asOf ?? asOf) ? <AsOfNote date={board.asOf ?? asOf} label="From docs.house.gov and GovInfo. Fetched" /> : null}

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
    </PageSpacer>
  );
}
