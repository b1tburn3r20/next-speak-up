import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillSummaries from "./AIBillSummaries";
import AIBillSummaries from "./AIBillSummaries";

interface BillSummariesContainerProps {
  userId?: string;
}

const BillSummariesContainer = ({ userId }: BillSummariesContainerProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="Simplified" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-auto p-1 bg-muted/50">
          <TabsTrigger
            className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            value="Simplified"
          >
            <span className="truncate">Simplified</span>
          </TabsTrigger>
          <TabsTrigger
            className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 opacity-60 cursor-not-allowed"
            disabled
            value="Official"
          >
            <span className="truncate">Official</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="Simplified"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <div className="bg-card border-0 sm:border sm:rounded-lg sm:shadow-sm overflow-hidden">
            <AIBillSummaries userId={userId} />
          </div>
        </TabsContent>

        <TabsContent
          value="Official"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <div className="bg-card border-0 sm:border sm:rounded-lg sm:shadow-sm p-6 sm:p-8">
            <div className="text-center text-muted-foreground">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full mb-3">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Official Text Coming Soon
              </h3>
              <p className="text-sm sm:text-base max-w-md mx-auto">
                The official bill text will be available here once it's been
                processed and formatted for easy reading.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default BillSummariesContainer;
