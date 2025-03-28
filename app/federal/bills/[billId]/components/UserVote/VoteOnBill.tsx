import { Legislation } from "@prisma/client";
import React from "react";

interface VoteOnBillProps {
  bill: Legislation; // Replace with your actual votes type
  showVotePrompt?: boolean;
}

const VoteOnBill = ({ bill, showVotePrompt = false }: VoteOnBillProps) => {
  if (!showVotePrompt) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        Time to Vote!
      </h3>
      <p className="text-blue-700">
        Please review this bill and cast your vote below.
      </p>
      {/* Add your voting UI components here */}
    </div>
  );
};

export default VoteOnBill;
