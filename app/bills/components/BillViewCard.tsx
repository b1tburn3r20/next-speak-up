import { sanitizeText } from "@/app/utils/text";
import { Card } from "@/components/ui/card";
import { FullLegislation } from "@/lib/types/bill-types";
import { ArrowRight, Bell, BookOpen, CircleCheck } from "lucide-react";
import Link from "next/link";

interface BillViewCardProps {
  bill: FullLegislation;
  size?: "sm" | "md" | "lg";
}

// Helper function to get the most recent summary
const getLatestSummary = (summaries: any[]) => {
  if (!summaries || summaries.length === 0) return null;
  const sorted = summaries.sort((a, b) => {
    const dateA = new Date(a.actionDate || a.createdAt);
    const dateB = new Date(b.actionDate || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  return sorted[0];
};

// Helper function to get the most recent AI summary

// Size configuration object
const sizeConfig = {
  sm: {
    card: "h-[200px] w-[280px] rounded-2xl",
    padding: "p-4",
    title: "text-lg",
    titleMargin: "mb-3",
    billType: "text-sm",
    billMargin: "mb-3",
    summary: "text-xs",
    summarySpace: "space-y-2",
    icon: "w-6 h-6",
    iconPosition: "top-3 right-3",
    gradientStart: "top-2/3",
    bottomPadding: "p-3",
    bottomRounded: "rounded-xl",
    bottomSpacing: "p-3",
    viewText: "text-sm",
    billIdText: "text-xs",
    arrow: "w-4 h-4",
    arrowTranslate: "group-hover:translate-x-1",
  },
  md: {
    card: "h-[240px] w-[320px] rounded-2xl",
    padding: "p-5",
    title: "text-xl",
    titleMargin: "mb-4",
    billType: "text-base",
    billMargin: "mb-4",
    summary: "text-sm",
    summarySpace: "space-y-2",
    icon: "w-8 h-8",
    iconPosition: "top-4 right-4",
    gradientStart: "top-1/2",
    bottomPadding: "p-4",
    bottomRounded: "rounded-2xl",
    bottomSpacing: "p-3.5",
    viewText: "text-base",
    billIdText: "text-sm",
    arrow: "w-4.5 h-4.5",
    arrowTranslate: "group-hover:translate-x-1.5",
  },
  lg: {
    card: "h-[300px] aspect-square rounded-3xl",
    padding: "p-8",
    title: "text-3xl",
    titleMargin: "mb-6",
    billType: "text-lg",
    billMargin: "mb-6",
    summary: "text-sm",
    summarySpace: "space-y-3",
    icon: "w-24 h-24",
    iconPosition: "bottom-4 right-4",
    gradientStart: "top-1/3",
    bottomPadding: "p-6",
    bottomRounded: "rounded-3xl",
    bottomSpacing: "p-4",
    viewText: "text-lg",
    billIdText: "text-base",
    arrow: "w-5 h-5",
    arrowTranslate: "group-hover:translate-x-2",
  },
};

// Desktop Component
const DesktopBillCard = ({ bill, size = "lg" }: BillViewCardProps) => {
  const config = sizeConfig[size];
  const billIdentifier = `${bill.congress || "Unknown"} ${bill.type || ""} ${bill.number || ""
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

  const latestSummary = getLatestSummary(bill.summaries);

  const getIcon = () => {
    if (hasTracked) {
      return (
        <div className={`absolute ${config.iconPosition} z-5 pointer-events-none`}>
          <Bell className={`${config.icon} text-yellow-400`} />
        </div>
      );
    }

    if (hasViewed && !hasVoted) {
      return (
        <div className={`absolute ${config.iconPosition} z-5 pointer-events-none`}>
          <BookOpen className={`${config.icon} text-primary`} />
        </div>
      );
    }
    if (hasVoted) {
      return (
        <div className={`absolute ${config.iconPosition} z-5 pointer-events-none`}>
          <CircleCheck className={`${config.icon} text-green-500`} />
        </div>
      );
    }
  };
  const cleaned = sanitizeText(latestSummary?.text)
  return (
    <Link href={`/bills/${bill.name_id}`} className="block">
      <Card className={`${config.card} select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden`}>
        <div className={`absolute ${config.gradientStart} left-0 right-0 bottom-0 bg-linear-to-b from-background-light/0 via-background-light/80 to-background-light z-10 pointer-events-none`} />
        {getIcon()}

        <div className={`${config.padding} h-full flex flex-col relative`}>
          <div className={config.titleMargin}>
            <h3 className={`${config.title} font-bold text-muted-foreground line-clamp-2`}>
              {bill.title}
            </h3>
          </div>

          <div className={config.billMargin}>
            <div className={`${config.billType} font-semibold text-foreground`}>
              {bill.type} {bill.number}
            </div>
          </div>

          <div className="relative">
            <h4 className="text-base font-medium leading-tight text-muted-foreground">
              {bill.title || "Untitled Bill"}
            </h4>
          </div>

          <div className={`mt-6 relative ${config.summarySpace}`}>
            {latestSummary && (
              <div>
                <div className={`${config.summary} text-muted-foreground/70 line-clamp-3`}>
                  <div dangerouslySetInnerHTML={{ __html: cleaned }} />
                </div>
              </div>
            )}

          </div>

          <div className={`absolute bottom-0 left-0 right-0 z-20 ${config.bottomPadding}`}>
            <div className={`flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-xs ${config.bottomRounded} ${config.bottomSpacing} transition-all duration-500 ease-out`}>
              <span className={`${config.viewText} font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out`}>
                <span className="block group-hover:hidden"></span>
                <span className={`hidden group-hover:block ${config.billIdText}`}>
                  {billIdentifier}
                </span>
              </span>

              <ArrowRight className={`${config.arrow} text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary ${config.arrowTranslate} transition-all duration-500 ease-out`} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Mobile Component
const MobileBillCard = ({ bill, size = "sm" }: BillViewCardProps) => {
  const config = sizeConfig[size];
  const billIdentifier = `${bill.congress || "Unknown"} ${bill.type || ""} ${bill.number || ""
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

  const latestSummary = getLatestSummary(bill.summaries);
  const cleaned = sanitizeText(latestSummary?.text)

  const getIcon = () => {
    if (hasTracked) {
      return (
        <div className={`absolute ${config.iconPosition} z-10 pointer-events-none`}>
          <Bell className={`${config.icon} text-yellow-400`} />
        </div>
      );
    }

    if (hasViewed && !hasVoted) {
      return (
        <div className={`absolute ${config.iconPosition} z-10 pointer-events-none`}>
          <BookOpen className={`${config.icon} text-primary`} />
        </div>
      );
    }
    if (hasVoted) {
      return (
        <div className={`absolute ${config.iconPosition} z-10 pointer-events-none`}>
          <CircleCheck className={`${config.icon} text-green-500`} />
        </div>
      );
    }
  };

  return (
    <Link href={`/bills/${bill.name_id}`} className="block">
      <Card className={`${config.card} select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50`}>
        <div className={`absolute ${config.gradientStart} left-0 right-0 bottom-0 bg-linear-to-b from-background/0 via-background/50 to-background z-10 pointer-events-none`} />
        {getIcon()}

        <div className={`${config.padding} h-full flex flex-col relative`}>
          <div className={config.titleMargin}>
            <h3 className={`${config.title} font-bold text-muted-foreground line-clamp-2`}>
              {bill.title}
            </h3>
          </div>

          <div className={config.billMargin}>
            <div className={`${config.billType} font-semibold text-foreground`}>
              {bill.type} {bill.number}
            </div>
          </div>

          <div className={`flex-1 relative ${config.summarySpace} z-5`}>
            {latestSummary && (
              <div>
                <div className={`${config.summary} text-muted-foreground line-clamp-3 font-medium`}>
                  <div dangerouslySetInnerHTML={{ __html: cleaned }} />
                </div>
              </div>
            )}

          </div>

          <div className={`absolute bottom-0 left-0 right-0 z-20 ${config.bottomPadding}`}>
            <div className={`flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-xs ${config.bottomRounded} ${config.bottomSpacing} transition-all duration-500 ease-out`}>
              <span className={`${config.viewText} font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out`}>
                <span className="block group-hover:hidden"></span>
                <span className={`hidden group-hover:block ${config.billIdText}`}>
                  {billIdentifier}
                </span>
              </span>

              <ArrowRight className={`${config.arrow} text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary ${config.arrowTranslate} transition-all duration-500 ease-out`} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Main Server Component
const BillViewCard = ({ bill, size = "lg" }: BillViewCardProps) => {
  return (
    <>
      {/* Hidden on small screens, shown on md and above */}
      <div className="hidden md:block my-4 mx-2">
        <DesktopBillCard bill={bill} size={size} />
      </div>
      {/* Shown on small screens, hidden on md and above */}
      <div className="block md:hidden">
        <MobileBillCard bill={bill} size={size} />
      </div>
    </>
  );
};

export default BillViewCard;
