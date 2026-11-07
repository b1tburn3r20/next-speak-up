import Link from "next/link";
import { ArrowRight, CalendarClock, Landmark } from "lucide-react";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillStatusBadge } from "@/components/bills/bill-card";
import { FloorCategoryPill } from "@/components/bills/upcoming-bill-card";
import { OuterBlock } from "@/components/blocks";
import { AfterVote } from "@/components/civic/after-vote";
import { PolicyChip } from "@/components/civic/policy-chip";
import { Disclosure } from "@/components/ui/disclosure";
import type { FloorBoard as Board, FloorItem } from "@/lib/civic/floor";
import { type ChamberBoard, weekLabel } from "@/lib/civic/floor-logic";
import { billPath, routes } from "@/lib/routes";

type BillState = { position: string | null; following: boolean };

/** Long enough to scan on the dashboard. The upcoming page shows everything. */
export const DASHBOARD_WEEK_PREVIEW = 4;

const CHAMBER_NAMES = { house: "House", senate: "Senate" } as const;
type ChamberKey = keyof typeof CHAMBER_NAMES;

/**
 * Where each chamber goes next, from its own published notice. That's a meeting time, not a promise
 * of what passes, so the words stay with what the source says.
 */
export function RightNow({ board }: { board: Board }) {
  return (
    <section className="space-y-3" aria-labelledby="right-now-title" data-testid="right-now">
      <h2 id="right-now-title" className="text-xl font-extrabold">Right now in Congress</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {(["house", "senate"] as const).map((chamber) => {
          const meeting = board[chamber].nextMeeting;
          return (
            <div key={chamber} className="min-w-0 space-y-1 rounded-2xl border-2 border-b-4 bg-card p-4" data-testid={`next-meeting-${chamber}`}>
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground">
                <Landmark className="size-4 shrink-0 text-primary" aria-hidden />
                {CHAMBER_NAMES[chamber]}
              </p>
              {meeting ? (
                <>
                  <p className="break-words text-lg font-extrabold leading-snug">Meets next at {meeting.legislationRef}</p>
                  <p className="break-words text-sm">{meeting.title}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">We don&apos;t have its next meeting time yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** One bill on a chamber's list. Its status stays hidden until you've voted on it. */
function FloorRow({
  item,
  signedIn,
  state,
}: {
  item: FloorItem;
  signedIn: boolean;
  state?: BillState;
}) {
  const { bill } = item;
  // The Senate's text is a legal order, so its plain title comes from the bill.
  const senateOrder = item.title.startsWith("Ordered");
  const title = bill?.title ?? (senateOrder ? "We don't have this bill's details yet." : item.title);
  const status = bill ? <BillStatusBadge status={bill.currentStatus} slug={bill.slug} endDate={bill.session?.endDate} /> : null;
  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0" data-testid="board-item" data-category={item.category}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-extrabold">{item.legislationRef}</span>
        <FloorCategoryPill category={item.category} />
        {bill ? (
          signedIn ? (
            <AfterVote slug={bill.slug} initialPosition={state?.position ?? null}>
              {status}
            </AfterVote>
          ) : (
            status
          )
        ) : null}
      </div>
      <p className="break-words font-bold leading-snug">
        {bill ? (
          <Link href={billPath(bill.slug)} className="hover:underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </p>
      {bill?.policyArea ? <PolicyChip name={bill.policyArea} link slug={bill.slug} /> : null}
      {bill ? (
        <BillActionButtons
          slug={bill.slug}
          signedIn={signedIn}
          initialPosition={state?.position ?? null}
          initialFollowing={state?.following ?? false}
          showFollow={false}
        />
      ) : null}
      {senateOrder ? (
        <Disclosure title="Read the Senate's order">
          <p className="break-words text-sm" data-testid="senate-order">{item.title}</p>
        </Disclosure>
      ) : null}
    </li>
  );
}

function BoardWeek({
  title,
  empty,
  items,
  limit,
  signedIn,
  states,
  testId,
}: {
  title: string;
  empty: string;
  items: FloorItem[];
  limit?: number;
  signedIn: boolean;
  states: Map<number, BillState>;
  testId: string;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div className="space-y-2" data-testid={testId} data-count={items.length}>
      <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground">
        <CalendarClock className="size-4 shrink-0" aria-hidden />
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="divide-y-2">
          {shown.map((item) => (
            <FloorRow key={item.id} item={item} signedIn={signedIn} state={item.bill ? states.get(item.bill.id) : undefined} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="board-empty">{empty}</p>
      )}
      {items.length > shown.length ? (
        <Link href={routes.federal.upcoming} className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline" data-testid="board-see-all">
          See all {items.length}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

const EMPTY: Record<ChamberKey, { thisWeek: string; nextWeek: string }> = {
  house: {
    thisWeek: "Nothing is listed for this week. The House may be out, or this week's list has ended.",
    nextWeek: "Nothing is listed yet. The House usually publishes its list before the week starts.",
  },
  senate: {
    thisWeek: "No bill has a date this week. The Senate often sets its plans day to day.",
    nextWeek: "No bill has a date next week yet. The Senate often sets its plans day to day.",
  },
};

export function ChamberColumn({
  chamber,
  data,
  now,
  limit,
  signedIn,
  states,
}: {
  chamber: ChamberKey;
  data: ChamberBoard<FloorItem>;
  now: Date;
  limit?: number;
  signedIn: boolean;
  states: Map<number, BillState>;
}) {
  const shared = { limit, signedIn, states };
  const monday = (offset: number) => new Date(data.thisMonday.getTime() + offset * 7 * 24 * 60 * 60 * 1000);
  return (
    <OuterBlock className="min-w-0 space-y-5" data-testid={`board-${chamber}`}>
      <h3 className="text-lg font-extrabold">{CHAMBER_NAMES[chamber]} floor</h3>
      <BoardWeek {...shared} title={weekLabel(monday(0), now)} empty={EMPTY[chamber].thisWeek} items={data.thisWeek} testId={`board-${chamber}-this`} />
      <BoardWeek {...shared} title={weekLabel(monday(1), now)} empty={EMPTY[chamber].nextWeek} items={data.nextWeek} testId={`board-${chamber}-next`} />
      {data.later.length > 0 ? (
        <BoardWeek {...shared} title="Later" empty="" items={data.later} testId={`board-${chamber}-later`} />
      ) : null}
      {data.waiting.length > 0 ? (
        <BoardWeek {...shared} title="Waiting for floor time, with no date" empty="" items={data.waiting} testId={`board-${chamber}-waiting`} />
      ) : null}
    </OuterBlock>
  );
}

/** This week and next, for both chambers, always. An empty week says so instead of disappearing. */
export function FloorBoardGrid({
  board,
  now,
  limit,
  signedIn,
  states,
}: {
  board: Board;
  now: Date;
  limit?: number;
  signedIn: boolean;
  states: Map<number, BillState>;
}) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2" data-testid="floor-board">
      <ChamberColumn chamber="house" data={board.house} now={now} limit={limit} signedIn={signedIn} states={states} />
      <ChamberColumn chamber="senate" data={board.senate} now={now} limit={limit} signedIn={signedIn} states={states} />
    </div>
  );
}

