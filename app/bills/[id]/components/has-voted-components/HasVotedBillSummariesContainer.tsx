// HasVotedBillSummariesContainer.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillSummaries from "../AIBillSummaries";
import BillExtraActions from "../BillExtraActions/BillExtraActions";
import BillTextTab from "../BillTextTab";

interface HasVotedBillSummariesContainerProps {
  userId?: string;
  noOfficialSummary: boolean;
}

const HasVotedBillSummariesContainer = ({
  userId,
  noOfficialSummary,
}: HasVotedBillSummariesContainerProps) => {
  console.log(noOfficialSummary);
  return (
    <div className="w-full">
      <Tabs defaultValue="Simplified" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex justify-between w-full items-center gap-4">
            <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/50">
              <TabsTrigger
                className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                value="Simplified"
              >
                <span className="truncate">Simplified</span>
              </TabsTrigger>
              <TabsTrigger
                className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 opacity-60 cursor-not-allowed"
                disabled={noOfficialSummary}
                value="Official"
              >
                <span className="truncate">
                  {noOfficialSummary
                    ? "No Official Summary"
                    : "Official Summary"}
                </span>
              </TabsTrigger>
              <TabsTrigger
                className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                value="bill-text"
              >
                <span className="truncate">Bill Text</span>
              </TabsTrigger>
            </TabsList>
            <BillExtraActions userId={userId} />
          </div>
        </div>

        <TabsContent value="Simplified" className="mt-0">
          <BillSummaries userId={userId} />
        </TabsContent>

        <TabsContent value="Official" className="mt-0">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground">
              Official summary coming soon...
            </p>
          </div>
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

export default HasVotedBillSummariesContainer;
