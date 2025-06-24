import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillSummaries from "../BillSummaries";

interface HasVotedBillSummariesContainerProps {
  userId?: string;
}

const HasVotedBillSummariesContainer = ({
  userId,
}: HasVotedBillSummariesContainerProps) => {
  return (
    <Tabs defaultValue="Simplified">
      <TabsList defaultValue="Simplified">
        <TabsTrigger className="font-bold" value="Simplified">
          Simplified
        </TabsTrigger>
        <TabsTrigger className="font-bold" disabled value="Official">
          Official
        </TabsTrigger>
      </TabsList>

      <TabsContent value="Simplified">
        <BillSummaries userId={userId} />
      </TabsContent>
      <TabsContent value="Official">Official</TabsContent>
    </Tabs>
  );
};

export default HasVotedBillSummariesContainer;
