import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoSummaries from "./NoSummaries";
import { Legislation } from "@prisma/client";
import AiLegislationComponent from "./AiLegislationComponent";

type BillSummaryProps = {
  bill: Legislation;
  className?: string;
};

export const BillSummary = ({ bill, className = "" }: BillSummaryProps) => {
  // If both summaries are null, don't render anything
  if (!bill.summary && !bill.ai_summary) {
    return <NoSummaries />;
  }

  return (
    <Card className={className}>
      <CardContent>
        <Tabs defaultValue={bill.ai_summary ? "ai" : "official"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="ai"
              disabled={!bill.ai_summary}
              className={!bill.ai_summary ? "cursor-not-allowed" : ""}
            >
              ✨ AI Simplified
            </TabsTrigger>
            <TabsTrigger
              value="official"
              disabled={!bill.summary}
              className={!bill.summary ? "cursor-not-allowed" : ""}
            >
              {!bill.summary ? "No Official Summary" : `Official`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            <AiLegislationComponent bill={bill} />
          </TabsContent>
          <TabsContent value="official">
            <div className="p-4">
              {bill.summary ? (
                <p
                  className="whitespace-pre-wrap
              
              mt-4 tracking-tighter text-sm/8 line- p-2 rounded-xl font-dyslexic"
                >
                  {bill.summary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-4">
                  No official summary available
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BillSummary;
