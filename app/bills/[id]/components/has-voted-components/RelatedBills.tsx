import { useBillPageStore } from "../../useBillPageStore";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ArrowRight, Link2 } from "lucide-react";
import Link from "next/link";

const RelatedBills = () => {
  const relatedBills = useBillPageStore(
    (f) => f.billData?.legislation?.relatedBills
  );

  // Helper function to format bill ID
  const formatBillId = (billId) => {
    return billId ? billId.toUpperCase() : "";
  };

  if (!relatedBills || relatedBills.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Related Bills</h2>
        <Card className="h-[120px] w-full select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-dashed border-border/30 rounded-xl">
          {/* Subtle gradient overlay for consistency */}
          <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/60 to-background z-10 pointer-events-none" />

          <div className="p-4 h-full flex flex-col relative items-center justify-center text-center">
            {/* Icon at the top */}
            <div className="mb-2 relative z-20">
              <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-all duration-300">
                <Link2 className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300" />
              </div>
            </div>

            {/* Title */}
            <div className="mb-1 relative z-20">
              <h3 className="text-sm font-medium text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-300">
                No Related Bills
              </h3>
            </div>

            {/* Message */}
            <div className="relative z-20">
              <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-xs group-hover:text-muted-foreground/80 transition-colors duration-300">
                This bill has no related legislation at this time.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Use fixed height classes instead of dynamic ones
  const getContainerHeight = () => {
    if (relatedBills.length <= 2) return "h-[200px]";
    if (relatedBills.length <= 4) return "h-[300px]";
    return "h-[400px]";
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground mb-3">
        Related Bills
      </h2>
      <ScrollArea className={`${getContainerHeight()} w-full`}>
        <div className="flex flex-col gap-2 p-1">
          {relatedBills.map((bill) => (
            <Link
              key={bill.id}
              href={`/bills/${bill.legislationId}`}
              className="block"
            >
              <Card className="h-[80px] w-full select-none group cursor-pointer hover:shadow-md transition-all duration-300 relative overflow-hidden border border-border/30 rounded-lg">
                {/* Subtle gradient overlay for consistency */}
                <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/60 to-background z-10 pointer-events-none" />

                <div className="p-3 h-full flex items-center relative">
                  {/* Icon on the left */}
                  <div className="mr-3 relative z-20 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-all duration-300">
                      <FileText className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 min-w-0 relative z-20">
                    {/* Bill Name ID */}
                    <div className="mb-1">
                      <h3 className="text-sm font-medium text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-300 truncate">
                        {formatBillId(bill.relatedNameId)}
                      </h3>
                    </div>

                    {/* Bill Title */}
                    <div className="mb-1">
                      <p className="text-xs text-muted-foreground/60 leading-tight group-hover:text-muted-foreground/80 transition-colors duration-300 line-clamp-2">
                        {bill.title}
                      </p>
                    </div>

                    {/* Relationship Type */}
                    <div>
                      <p className="text-xs text-muted-foreground/50 leading-tight group-hover:text-muted-foreground/70 transition-colors duration-300 truncate">
                        {bill.relationshipType}
                      </p>
                    </div>
                  </div>

                  {/* Action area on the right */}
                  <div className="ml-3 relative z-20 flex-shrink-0">
                    <div className="flex items-center justify-center border border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-lg p-2 transition-all duration-300 ease-out">
                      {/* Action text */}
                      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out mr-1 whitespace-nowrap">
                        View
                      </span>

                      {/* Arrow with smoother animation */}
                      <ArrowRight className="w-3 h-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ease-out" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RelatedBills;
