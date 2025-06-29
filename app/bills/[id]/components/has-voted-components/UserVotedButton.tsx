// UserVotedButton.tsx
"use client";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState } from "react";
import { useBillPageStore } from "../../useBillPageStore";

export function UserVotedButton() {
  const BillData = useBillPageStore((s) => s.billData);
  const [loading, setLoading] = useState(false);
  const setBillData = useBillPageStore((s) => s.setBillData);
  const userDeterminedVote = BillData.userVote.votePosition;

  const isYeaVote = userDeterminedVote === "YEA";

  if (loading) {
    return (
      <Button
        className="w-full h-11 font-semibold"
        disabled
        variant="secondary"
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <div className="w-full">
      <Button
        className={`w-full h-11 font-semibold flex items-center justify-center gap-2 ${
          isYeaVote
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
        disabled
      >
        {isYeaVote ? (
          <>
            <ThumbsUp className="w-4 h-4" />
            You Voted: YEA
            <CheckCircle2 className="w-4 h-4" />
          </>
        ) : (
          <>
            <ThumbsDown className="w-4 h-4" />
            You Voted: NAY
            <XCircle className="w-4 h-4" />
          </>
        )}
      </Button>
      <div className="mt-2 text-center">
        <Badge variant="outline" className="text-xs">
          Vote Recorded
        </Badge>
      </div>
    </div>
  );
}
