import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillSummaries from "./BillSummaries";

interface BillSummariesContainerProps {
  userId?: string;
}

const BillSummariesContainer = ({ userId }: BillSummariesContainerProps) => {
  return (
    <Tabs defaultValue="Simplified">
      <TabsList
        defaultValue="Simplified"
        className="grid grid-cols-2 w-full font-bold"
      >
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

export default BillSummariesContainer;
