"use client";

import { Legislation } from "@prisma/client";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AiLegislationComponent from "../../Summary/ai-legislation-component";
import BillSummary from "../../Summary/bill-summary";

interface VoteFederalBillSummaryProps {
  bill: Legislation;
  hideDictionary?: boolean;
  className?: string;
}

export function VoteFederalBillSummary({
  bill,
  hideDictionary,
  className = "",
}: VoteFederalBillSummaryProps) {
  return (
    <BillSummary
      bill={bill}
      hideDictionary={hideDictionary}
      className={className}
    />
  );
}
