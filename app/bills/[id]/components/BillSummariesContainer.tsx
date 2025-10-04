import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIBillSummaries from "./AIBillSummaries";
import BillTextTab from "./BillTextTab";

interface BillSummariesContainerProps {
  userId?: string;
  noOfficialSummary: boolean;
}

const BillSummariesContainer = ({
  userId,
  noOfficialSummary,
}: BillSummariesContainerProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="Simplified" className="w-full">
        <div>
          <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/50">
            <TabsTrigger
              className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              value="Simplified"
            >
              <span className="truncate">Simplified</span>
            </TabsTrigger>
            <TabsTrigger
              className="font-bold  text-center text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 opacity-60 cursor-not-allowed"
              disabled={noOfficialSummary}
              value="Official"
            >
              <span className="truncate text-center">
                {noOfficialSummary ? "No Official Summary" : "Official Summary"}
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              value="bill-text"
            >
              <span className="truncate">Bill Text</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="Simplified"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <div>
            <AIBillSummaries userId={userId} />
          </div>
        </TabsContent>

        <TabsContent
          value="Official"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <p>coming soon</p>
        </TabsContent>
        <TabsContent
          value="bill-text"
          className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <BillTextTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default BillSummariesContainer;
