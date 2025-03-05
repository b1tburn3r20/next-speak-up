import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NoSummaries from "./NoSummaries";
import { Legislation } from "@prisma/client";
import AiLegislationComponent from "./AiLegislationComponent";

type BillSummaryProps = {
  bill: Legislation;
  hideDictionary?: boolean;
  className?: string;
};

export const BillSummary = ({
  bill,
  hideDictionary = false,
  className = "",
}: BillSummaryProps) => {
  // If both summaries are null, don't render anything
  if (!bill.summary && !bill.ai_summary) {
    return <NoSummaries />;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <Tabs defaultValue={bill.ai_summary ? "ai" : "official"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="ai"
              disabled={!bill.ai_summary}
              className={!bill.ai_summary ? "cursor-not-allowed font-bold" : ""}
            >
              <span className="font-extrabold select-none">
                ✨ AI Simplified
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="official"
              disabled={!bill.summary}
              className={
                !bill.summary ? "cursor-not-allowed select-none" : "select-none"
              }
            >
              {!bill.summary ? "No Official Summary" : `Official`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            <AiLegislationComponent
              bill={bill}
              hideDictionary={hideDictionary}
            />
          </TabsContent>
          <TabsContent value="official">
            <div className="p-4 bg-ultra-muted rounded-2xl">
              {bill.summary ? (
                <p
                  className="whitespace-pre-wrap
              
              tracking-tighter text-sm/8 rounded-xl font-dyslexic"
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
