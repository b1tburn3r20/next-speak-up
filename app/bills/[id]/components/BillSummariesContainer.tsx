import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillTextTab from "./BillTextTab";
import BillOfficialSummaries from "./BillOfficialSummaries";
import { BillSummary } from "@prisma/client";

interface BillSummariesContainerProps {
  userId?: string;
  hasOfficialSummary: boolean;
  summaries: BillSummary[]
}

const BillSummariesContainer = ({
  userId,
  hasOfficialSummary,
  summaries
}: BillSummariesContainerProps) => {


  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs key={hasOfficialSummary.toString()} defaultValue={hasOfficialSummary ? "bill-summary" : "bill-text"} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          {/* <TabsTrigger */}
          {/*   className="font-bold text-sm sm:text-base py-2 px-3 sm:py-3 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all duration-200" */}
          {/*   value="Simplified" */}
          {/* > */}
          {/*   <span className="truncate">Simplified</span> */}
          {/* </TabsTrigger> */}
          <TabsTrigger
            disabled={!hasOfficialSummary}
            value="bill-summary"
          >
            {!hasOfficialSummary ? "No Official Summary" : "Official Summary"}
          </TabsTrigger>
          <TabsTrigger
            value="bill-text"
          >
            <span className="truncate">Bill Text</span>
          </TabsTrigger>
        </TabsList>
        {/* <TabsContent */}
        {/*   value="Simplified" */}
        {/*   className="mt-4 sm:mt-6 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg" */}
        {/* > */}
        {/*   <div> */}
        {/*     <AIBillSummaries userId={userId} /> */}
        {/*   </div> */}
        {/* </TabsContent> */}
        {/**/}
        <TabsContent
          value="bill-summary"
          className="mt-4"
        >
          <BillOfficialSummaries summaries={summaries} />
        </TabsContent>
        <TabsContent
          value="bill-text"
          className="mt-4 sm:mt-6 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:rounded-lg"
        >
          <BillTextTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default BillSummariesContainer;
