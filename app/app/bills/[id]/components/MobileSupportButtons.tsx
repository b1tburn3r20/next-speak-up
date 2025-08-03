"use client";

import React, { useState } from "react";
import { Legislation } from "@prisma/client";
import { X, Check } from "lucide-react";
import { BillVote } from "@/lib/services/legislation_two";
import { useBillPageStore } from "../useBillPageStore";

interface MobileSupportBillButtonProps {
  bill: Legislation;
  votes?: BillVote[];
}

export function MobileSupportBillButton({
  bill,
  votes,
}: MobileSupportBillButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const setBillData = useBillPageStore((d) => d.setBillData);

  const handleVote = async (isYesVote: boolean) => {
    if (isLoading) return;

    setIsLoading(true);
    const vote = isYesVote ? "YEA" : "NAY";

    try {
      const response = await fetch("/api/bills/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legislationNameId: bill.name_id,
          vote,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const voteData: any = await response.json();
      setBillData(voteData.data);
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm mx-auto">
      {/* Support Button */}
      <button
        onClick={() => handleVote(true)}
        disabled={isLoading}
        className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 min-h-[60px] shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Check className="w-6 h-6" />
        <span className="text-lg">Support</span>
      </button>

      {/* Oppose Button */}
      <button
        onClick={() => handleVote(false)}
        disabled={isLoading}
        className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 min-h-[60px] shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <X className="w-6 h-6" />
        <span className="text-lg">Oppose</span>
      </button>
    </div>
  );
}
