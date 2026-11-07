import { Hourglass, Landmark } from "lucide-react";
import { billOutlook } from "@/lib/civic/bill-outlook";
import { cn } from "@/lib/utils";

/** The status, worded around what it means for you, shown after you've voted. */
export function BillOutlookCard({ status, slug, endDate }: { status: string; slug?: string; endDate?: Date | null }) {
  const outlook = billOutlook(status, { slug, endDate });
  const Icon = outlook.kind === "OPEN" ? Hourglass : Landmark;
  return (
    <div
      className={cn(
        "animate-rise-in flex gap-3 rounded-xl p-3",
        outlook.kind === "OPEN" ? "bg-support-tint" : "bg-muted",
      )}
      data-testid="bill-outlook"
      data-kind={outlook.kind}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", outlook.kind === "OPEN" && "text-support")} aria-hidden />
      <div className="min-w-0">
        <p className="font-extrabold leading-snug">{outlook.title}</p>
        <p className="text-sm">{outlook.body}</p>
      </div>
    </div>
  );
}
