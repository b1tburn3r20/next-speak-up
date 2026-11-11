import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState } from "@/components/app/page-states";
import { SectionTabs } from "@/components/app/section-tabs";
import { ChamberColumn, RightNow } from "@/components/bills/floor-board";
import { PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
import { FloorProgress, LiveCount } from "@/components/bills/floor-progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NextStepCard } from "@/components/civic/next-step-card";
import { Term } from "@/components/civic/term";
import { floorBoardBillIds, getFloorBoard, getFloorSchedule, type FloorItem } from "@/lib/civic/floor";
import { floorOutcome, groupFloorWeeks, splitFloorItems } from "@/lib/civic/floor-logic";
import { getUserBillStates } from "@/lib/civic/users";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Upcoming votes",
  description: "What the House and Senate may vote on soon, so you can weigh in first.",
};

/**
 * What Congress may vote on next, one chamber at a time: this week, next week, and later, each bill a row
 * you can vote on right there. It's the one place for the schedule; home only counts it.
 */
export default async function UpcomingBillsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const signedIn = Boolean(userId);
  const now = new Date();
  const [items, board] = await Promise.all([getFloorSchedule(now), getFloorBoard(now)]);
  const billIds = [...items.flatMap((item) => (item.bill ? [item.bill.id] : [])), ...floorBoardBillIds(board)];
  const states = userId ? await getUserBillStates(userId, billIds) : new Map();
  const weeks = groupFloorWeeks(items, now);
  const hasUpcoming = weeks.some((week) => week.position === "THIS" || week.position === "NEXT");
  const houseCount = weeks.filter((week) => week.position === "THIS" || week.position === "NEXT").reduce((sum, week) => sum + week.items.length, 0);
  const senateCount = board.senate.thisWeek.length + board.senate.nextWeek.length + board.senate.waiting.length;

  // The House publishes a full weekly list, so each bill gets a card: its topic, sponsor, and what it does.
  const card = (item: FloorItem) => (
    <UpcomingBillCard key={item.id} item={item} signedIn={signedIn} state={item.bill ? states.get(item.bill.id) : undefined} />
  );
  const empty = !hasUpcoming ? (
    <EmptyState title="Nothing on the House schedule right now" action={{ href: routes.vote, label: "Vote on recent bills instead" }}>
      The House may be out of session. A new schedule usually appears before the next week starts.
    </EmptyState>
  ) : null;

  // Signed out, the weeks in order. Signed in, the same bills split by what's left for you to do.
  const byWeek = (
    <div className="space-y-6">
      {empty}
      {weeks.map((week) => (
        <Section key={week.weekOf.toISOString()} title={week.label} description={`${week.items.length} bill${week.items.length === 1 ? "" : "s"}`} data-testid="floor-week">
          <Stack>{week.items.map(card)}</Stack>
        </Section>
      ))}
    </div>
  );

  const split = splitFloorItems(items, (billId) => states.get(billId)?.position);
  const slugsOf = (list: FloorItem[]) => list.flatMap((item) => (item.bill ? [item.bill.slug] : []));
  const initial = Object.fromEntries(
    [...split.voted, ...split.waiting, ...split.missed].flatMap((item) => (item.bill ? [[item.bill.slug, states.get(item.bill.id)?.position ?? null]] : [])),
  );
  // What Congress hasn't voted on yet: the bills you can still beat it to.
  const notYetVoted = [...split.voted.filter((item) => !item.bill || !floorOutcome(item.bill.actions, item.weekOf)), ...split.waiting];
  const allSlugs = slugsOf([...split.voted, ...split.waiting, ...split.missed]);
  const groups = [
    {
      id: "voted",
      title: "You've voted",
      hint: "Open one to see how it's going.",
      items: split.voted,
      count: <LiveCount slugs={allSlugs} initial={initial} mode="voted" />,
    },
    {
      id: "waiting",
      title: "Up soon, waiting on your vote",
      hint: "Congress hasn't voted on these yet. Vote first, and see if your reps agree with you.",
      items: split.waiting,
      count: <LiveCount slugs={slugsOf(split.waiting)} initial={initial} mode="left" />,
    },
    {
      id: "missed",
      title: "Congress already voted",
      hint: "You haven't weighed in on these. Vote to find out how it went, and how your reps voted.",
      items: split.missed,
      count: <LiveCount slugs={slugsOf(split.missed)} initial={initial} mode="left" />,
    },
  ];
  const bySplit = (
    <div className="space-y-4">
      {empty}
      <FloorProgress slugs={slugsOf(notYetVoted)} initial={initial} />
      <Accordion type="multiple" defaultValue={split.waiting.length > 0 ? ["waiting"] : []} className="gap-3" data-testid="floor-groups">
        {groups.map((group) => (
          <AccordionItem key={group.id} value={group.id} className="rounded-2xl border-2 border-b-4 bg-card px-4 not-last:border-b-4" data-testid={`floor-group-${group.id}`}>
            <AccordionTrigger className="text-base hover:no-underline" data-testid={`floor-group-${group.id}-trigger`}>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary-tint px-2 py-0.5 text-sm text-primary">{group.count}</span>
                <span className="min-w-0 break-words">{group.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 [&_a]:no-underline [&_a:hover]:underline">
              <p className="text-sm text-muted-foreground">{group.hint}</p>
              {group.items.length > 0 ? (
                <Stack>{group.items.map(card)}</Stack>
              ) : (
                <p className="text-sm font-bold">{group.id === "waiting" ? "You've voted on every bill coming up. Nice." : "None right now."}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
  const house = signedIn ? bySplit : byWeek;

  return (
    <PageSpacer>
      <PageHeader
        title="Upcoming votes"
        description="Bills Congress may vote on soon. Vote on them first, then see what your reps do."
      />
      <p className="-mt-4 text-sm text-muted-foreground">
        Being on the <Term id="floor">floor</Term>{" "}list means a bill may come up. It doesn&apos;t mean it will, and plans change during the week.
      </p>

      <SectionTabs
        testId="chamber-tabs"
        tabTestId="chamber-tab"
        tabs={[
          {
            id: "house",
            label: `House (${houseCount})`,
            content: house,
          },
          {
            id: "senate",
            label: `Senate (${senateCount})`,
            content: (
              <div className="space-y-3">
                <ChamberColumn chamber="senate" data={board.senate} now={now} signedIn={signedIn} states={states} />
                <p className="text-sm text-muted-foreground">
                  The Senate doesn&apos;t publish a weekly list like the House does. This is what its Calendar and Daily Digest say, which is usually only a few items.
                </p>
              </div>
            ),
          },
        ]}
      />

      {/* When each chamber meets next. Under the list, because the list is what you came to vote on. */}
      <RightNow board={board} />

      {board.asOf ? <AsOfNote date={board.asOf} label="From docs.house.gov and GovInfo. Fetched" /> : null}

      <NextStepCard
        label="When you're done here"
        step={{
          id: "after-upcoming",
          title: "Now see what your reps already voted on",
          description: "Vote first, then find out if you match.",
          href: routes.vote,
          cta: "Start voting",
          tone: "primary",
        }}
      />
    </PageSpacer>
  );
}
