import { Card } from "@/components/ui/card";
import { FullLegislation } from "@/lib/types/bill-types";
import { ArrowRight, Bell, BookOpen, CircleCheck } from "lucide-react";
import Link from "next/link";

interface BillViewCardProps {
  bill: FullLegislation;
}

// Helper function to get the most recent summary
const getLatestSummary = (summaries: any[]) => {
  if (!summaries || summaries.length === 0) return null;
  // Sort by actionDate or createdAt, most recent first
  const sorted = summaries.sort((a, b) => {
    const dateA = new Date(a.actionDate || a.createdAt);
    const dateB = new Date(b.actionDate || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  return sorted[0];
};

// Helper function to get the most recent AI summary
const getLatestAiSummary = (aiSummaries: any[]) => {
  if (!aiSummaries || aiSummaries.length === 0) return null;
  // Sort by actionDate or createdAt, most recent first
  const sorted = aiSummaries.sort((a, b) => {
    const dateA = new Date(a.actionDate || a.createdAt);
    const dateB = new Date(b.actionDate || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  return sorted[0];
};

// Desktop Component - Your exact preferred version
const DesktopBillCard = ({ bill }: BillViewCardProps) => {
  const billIdentifier = `${bill.congress || "Unknown"} ${bill.type || ""} ${
    bill.number || ""
  }`.trim();

  const hasViewed =
    bill.userTracks &&
    bill.userTracks.length > 0 &&
    bill.userTracks[0].hasViewed;

  const hasTracked =
    bill.userTracks &&
    bill.userTracks.length > 0 &&
    bill.userTracks[0].tracking;
  const hasVoted = bill.userVotes && bill.userVotes.length > 0;

  // Get the latest summaries
  const latestSummary = getLatestSummary(bill.summaries);
  const latestAiSummary = getLatestAiSummary(bill.aiSummaries);

  const getIcon = () => {
    if (hasTracked) {
      return (
        <div className="absolute bottom-4 right-4 z-5 pointer-events-none">
          <Bell className="w-24 h-24 text-yellow-400" />
        </div>
      );
    }

    if (hasViewed && !hasVoted) {
      return (
        <div className="absolute bottom-4 right-4 z-5 pointer-events-none">
          <BookOpen className="w-24 h-24 text-primary" />
        </div>
      );
    }
    if (hasVoted) {
      return (
        <div className="absolute bottom-4 right-4 z-5 pointer-events-none">
          <CircleCheck className="w-24 h-24 text-green-500" />
        </div>
      );
    }
  };

  return (
    <Link href={`/bills/${bill.name_id}`} className="block">
      <Card className="h-[300px] aspect-square select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50 rounded-3xl">
        {/* Aggressive gradient overlay - gets to 100% much faster */}
        <div className="absolute top-1/3 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/80 to-background z-10 pointer-events-none" />
        {getIcon()}

        <div className="p-8 h-full flex flex-col relative">
          {/* Updated date - large bold at top */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold text-muted-foreground line-clamp-2">
              {bill.title}
            </h3>
          </div>

          {/* Bill type and number */}
          <div className="mb-6">
            <div className="text-lg font-semibold text-foreground">
              {bill.type} {bill.number}
            </div>
          </div>

          {/* Title that fades behind gradient */}
          <div className="relative">
            <h4 className="text-base font-medium leading-tight text-muted-foreground">
              {bill.title || "Untitled Bill"}
            </h4>
          </div>

          {/* Summary section - both regular and AI summary */}
          <div className="mt-6 relative space-y-3">
            {/* Regular summary */}
            {latestSummary && (
              <div>
                <p className="text-sm text-muted-foreground/70 line-clamp-3">
                  {latestSummary.text}
                </p>
              </div>
            )}

            {/* AI summary - right under regular summary if it exists */}
            {latestAiSummary && (
              <div>
                <p className="text-sm text-muted-foreground/60 italic">
                  {latestAiSummary.text}
                </p>
              </div>
            )}
          </div>

          {/* Bottom action area with primary border on hover */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
            <div className="flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-3xl p-4 transition-all duration-500 ease-out">
              {/* Consistent size and weight, only color changes */}
              <span className="text-lg font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out">
                <span className="block group-hover:hidden">View</span>
                <span className="hidden group-hover:block">
                  {billIdentifier}
                </span>
              </span>

              {/* Arrow with smoother animation */}
              <ArrowRight className="w-5 h-5 text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Mobile Component - Optimized for small screens
const MobileBillCard = ({ bill }: BillViewCardProps) => {
  const billIdentifier = `${bill.congress || "Unknown"} ${bill.type || ""} ${
    bill.number || ""
  }`.trim();

  const hasViewed =
    bill.userTracks &&
    bill.userTracks.length > 0 &&
    bill.userTracks[0].hasViewed;

  const hasTracked =
    bill.userTracks &&
    bill.userTracks.length > 0 &&
    bill.userTracks[0].tracking;
  const hasVoted = bill.userVotes && bill.userVotes.length > 0;

  // Get the latest summaries
  const latestSummary = getLatestSummary(bill.summaries);
  const latestAiSummary = getLatestAiSummary(bill.aiSummaries);

  const getIcon = () => {
    if (hasTracked) {
      return (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Bell className="w-6 h-6 text-yellow-400" />
        </div>
      );
    }

    if (hasViewed && !hasVoted) {
      return (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
      );
    }
    if (hasVoted) {
      return (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <CircleCheck className="w-6 h-6 text-green-500" />
        </div>
      );
    }
  };

  return (
    <Link href={`/bills/${bill.name_id}`} className="block">
      <Card className="h-[200px] w-[280px] select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50 rounded-2xl">
        {/* Mobile-optimized gradient overlay */}
        <div className="absolute top-2/3 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/50 to-background z-10 pointer-events-none" />
        {getIcon()}

        <div className="p-4 h-full flex flex-col relative">
          {/* Title - mobile sizing */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-muted-foreground line-clamp-2">
              {bill.title}
            </h3>
          </div>

          {/* Bill type and number */}
          <div className="mb-3">
            <div className="text-sm font-semibold text-foreground">
              {bill.type} {bill.number}
            </div>
          </div>

          {/* Summary section - mobile optimized */}
          <div className="flex-1 relative space-y-2 z-5">
            {/* Regular summary */}
            {latestSummary && (
              <div>
                <p className="text-xs text-muted-foreground line-clamp-3 font-medium">
                  {latestSummary.text}
                </p>
              </div>
            )}

            {/* AI summary */}
            {latestAiSummary && (
              <div>
                <p className="text-xs text-muted-foreground/80 italic line-clamp-2">
                  {latestAiSummary.text}
                </p>
              </div>
            )}
          </div>

          {/* Bottom action area */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
            <div className="flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-xl p-3 transition-all duration-500 ease-out">
              <span className="text-sm font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out">
                <span className="block group-hover:hidden">View</span>
                <span className="hidden group-hover:block text-xs">
                  {billIdentifier}
                </span>
              </span>

              <ArrowRight className="w-4 h-4 text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Main Server Component
const BillViewCard = ({ bill }: BillViewCardProps) => {
  return (
    <>
      {/* Hidden on small screens, shown on md and above */}
      <div className="hidden md:block">
        <DesktopBillCard bill={bill} />
      </div>
      {/* Shown on small screens, hidden on md and above */}
      <div className="block md:hidden">
        <MobileBillCard bill={bill} />
      </div>
    </>
  );
};

export default BillViewCard;
