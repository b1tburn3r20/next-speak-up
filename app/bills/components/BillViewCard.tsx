import { Card } from "@/components/ui/card";
import { Legislation } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface BillViewCardProps {
  bill: Legislation;
}

const BillViewCard = ({ bill }: BillViewCardProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const billDate = new Date(date);

    // Check if dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };

    if (isSameDay(billDate, today)) {
      return "Today";
    } else if (isSameDay(billDate, yesterday)) {
      return "Yesterday";
    } else {
      return billDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const billIdentifier = `${bill.congress || "Unknown"} ${bill.type || ""} ${
    bill.number || ""
  }`.trim();

  return (
    <Link href={`/bill/${bill.id}`} className="block">
      <Card className="aspect-square select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50 rounded-3xl">
        {/* Aggressive gradient overlay - gets to 100% much faster */}
        <div className="absolute top-1/3 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/80 to-background z-10 pointer-events-none" />

        <div className="p-8 h-full flex flex-col relative">
          {/* Updated date - large bold at top */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold text-muted-foreground">
              {formatDate(bill.updatedAt)}
            </h3>
          </div>

          {/* Bill type and number */}
          <div className="mb-6">
            <div className="text-lg font-semibold text-foreground">
              {bill.type} {bill.number}
            </div>
          </div>

          {/* Title that fades behind gradient */}
          <div className=" relative">
            <h4 className="text-base font-medium leading-tight text-muted-foreground">
              {bill.title || "Untitled Bill"}
            </h4>
          </div>

          {/* Summary section - both regular and AI summary */}
          <div className="mt-6 relative space-y-3">
            {/* Regular summary */}
            {bill.summary && (
              <div>
                <p className="text-sm text-muted-foreground/70 line-clamp-3">
                  {bill.summary}
                </p>
              </div>
            )}

            {/* AI summary - right under regular summary if it exists */}
            {bill.ai_summary && (
              <div>
                <p className="text-sm text-muted-foreground/60 italic">
                  {bill.ai_summary}
                </p>
              </div>
            )}
          </div>

          {/* Bottom action area with accent border on hover */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
            <div className="flex items-center justify-between border-2 border-transparent group-hover:border-accent group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-3xl p-4 transition-all duration-500 ease-out">
              {/* Consistent size and weight, only color changes */}
              <span className="text-lg font-bold text-muted-foreground/60 group-hover:text-accent transition-all duration-500 ease-out">
                <span className="block group-hover:hidden">View</span>
                <span className="hidden group-hover:block">
                  {billIdentifier}
                </span>
              </span>

              {/* Arrow with smoother animation */}
              <ArrowRight className="w-5 h-5 text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-accent group-hover:translate-x-2 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default BillViewCard;
