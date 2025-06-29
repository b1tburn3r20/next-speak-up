// HasVotedBillSummariesContainer.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import BillSummaries from "../AIBillSummaries";

interface HasVotedBillSummariesContainerProps {
  userId?: string;
}

const HasVotedBillSummariesContainer = ({
  userId,
}: HasVotedBillSummariesContainerProps) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="Simplified" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger className="font-semibold text-sm" value="Simplified">
              Simplified
            </TabsTrigger>
            <TabsTrigger
              className="font-semibold text-sm relative"
              disabled
              value="Official"
            >
              Official
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="Simplified" className="mt-0">
          <div className="bg-card border border-border rounded-lg p-4">
            <BillSummaries userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="Official" className="mt-0">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground">
              Official summary coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HasVotedBillSummariesContainer;
