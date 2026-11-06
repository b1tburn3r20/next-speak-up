import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState, PageContainer } from "@/components/app/page-states";
import { UpcomingBillCard } from "@/components/bills/upcoming-bill-card";
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
    <PageContainer>
      <div className="space-y-1">
        <nav className="text-sm">
          <Link href="/bills" className="underline">
            Bills
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold">Upcoming votes</h1>
        <p className="text-sm text-muted-foreground">
          What the House may vote on, so you can weigh in before your representative does. Being
          listed doesn&apos;t guarantee a vote, and the schedule changes during the week. The Senate
          doesn&apos;t publish a schedule in this form.
        </p>
      </div>

      {!hasUpcoming ? (
        <EmptyState title="Nothing on the House schedule right now" action={{ href: "/bills", label: "Browse recent bills" }}>
          The House may be out of session. A new schedule usually appears before the next week
          starts.
        </EmptyState>
      ) : null}

      {weeks.map((week) => (
        <section key={week.weekOf.toISOString()} className="space-y-3" data-testid="floor-week">
          <h2 className="font-semibold">
            {week.label}{" "}
            <span className="font-normal text-muted-foreground">
              · {week.items.length} item{week.items.length === 1 ? "" : "s"}
            </span>
          </h2>
          {week.items.map((item) => (
            <UpcomingBillCard
              key={item.id}
              item={item}
              signedIn={Boolean(userId)}
              state={item.bill ? states.get(item.bill.id) : undefined}
            />
          ))}
        </section>
      ))}

      {asOf ? (
        <p className="text-xs text-muted-foreground">
          <AsOfNote date={asOf} label="From docs.house.gov. Fetched" />
        </p>
      ) : null}
    </PageContainer>
  );
}
