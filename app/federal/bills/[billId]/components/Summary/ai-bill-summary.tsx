import { Legislation } from "@prisma/client";
import React from "react";

interface AIBillSummaryProps {
  bill: Legislation;
}
const AIBillSummary = ({ bill }: AIBillSummaryProps) => {
  return (
    <div className="p-4">
      {" "}
      {bill.ai_summary ? (
        <p
          className="whitespace-pre-wrap
          
          tracking-tighter text-sm/8  p-2 rounded-xl font-dyslexic"
        >
          {bill.ai_summary}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No AI summary available
        </p>
      )}
    </div>
  );
};

export default AIBillSummary;
