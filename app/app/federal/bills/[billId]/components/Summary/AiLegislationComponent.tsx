import { Legislation } from "@prisma/client";
import React from "react";
import AiBillFinePrint from "./AIBills/AiBillFinePrint";
import AiBillHiddenImplications from "./AIBills/AiBillHiddenImplications";
import AiBillKeyTerms from "./AIBills/AiBillKeyTerms";
import AiBillSize from "./AIBills/AiBillSize";
import AIBillSummary from "./AIBillSummary";
interface AiLegislationComponentProps {
  bill: Legislation;
  hideDictionary?: boolean;
}
const AiLegislationComponent = ({
  bill,
  hideDictionary,
}: AiLegislationComponentProps) => {
  return (
    <div className="rounded-lg flex">
      <div className="flex flex-col bg-ultra-muted rounded-2xl">
        <AIBillSummary bill={bill} />
      </div>
      <div className="space-y-4 items-center flex flex-col pl-4">
        <AiBillSize bill={bill} />
        {!hideDictionary && <AiBillKeyTerms bill={bill} />}
        <AiBillFinePrint bill={bill} />
        <AiBillHiddenImplications bill={bill} />
      </div>
    </div>
  );
};

export default AiLegislationComponent;
