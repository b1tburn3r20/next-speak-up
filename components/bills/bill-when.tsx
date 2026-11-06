import { RelativeDate } from "@/components/app/relative-date";
import { billMoment, floorMoment } from "@/lib/civic/bill-moment";

type BillDates = Parameters<typeof billMoment>[0];

/** "Became law 2 months ago", or "Introduced 3 weeks ago". Hover or tap for the exact date. */
export function BillWhen({ bill, className }: { bill: BillDates; className?: string }) {
  const moment = billMoment(bill);
  if (!moment) return null;
  return <RelativeDate date={moment.date} label={moment.label} className={className ?? "text-sm"} />;
}

/** "House vote possible in 1 week, 3 days". The House only names a week, and says so on hover. */
export function FloorWhen({ weekOf, now, className }: { weekOf: Date; now: Date; className?: string }) {
  const moment = floorMoment(weekOf, now);
  return (
    <RelativeDate
      date={moment.monday}
      label={moment.text}
      text={moment.fixedText}
      exactDate={moment.exactDate}
      detail={moment.detail}
      className={className ?? "text-sm"}
    />
  );
}
