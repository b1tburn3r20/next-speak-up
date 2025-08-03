// components/bill-votes/vote-summary-card.jsx
"use client";
import { Percent } from "lucide-react";

export const voteStyles = {
  YEA: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20",
  NAY: "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20",
  NOT_VOTING:
    "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
  PRESENT:
    "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20",
};

export const VoteSummaryCard = ({ voteCount, totalVotes, type }) => {
  const percentage = ((voteCount / totalVotes) * 100).toFixed(1);

  const labels = {
    YEA: "Voted Yes",
    NAY: "Voted No",
    NOT_VOTING: "Not voting",
    PRESENT: "Present",
  };

  return (
    <div
      className={`rounded-lg p-4 flex flex-col items-center ${voteStyles[type]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl font-bold">{voteCount.toLocaleString()}</span>
        <div className="flex items-center text-sm opacity-75">
          <span>{percentage}</span>
          <Percent className="w-3 h-3 ml-0.5" />
        </div>
      </div>
      <span className="text-sm font-medium">{labels[type]}</span>
    </div>
  );
};
