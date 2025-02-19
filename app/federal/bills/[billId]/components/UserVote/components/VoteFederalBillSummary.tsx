"use client";

import { Legislation } from "@prisma/client";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AiLegislationComponent from "../../Summary/AiLegislationComponent";
import BillSummary from "../../Summary/BillSummary";

interface VoteFederalBillSummaryProps {
  bill: Legislation;
}

export function VoteFederalBillSummary({ bill }: VoteFederalBillSummaryProps) {
  return <BillSummary bill={bill} className="border-none shadow-none" />;
}
