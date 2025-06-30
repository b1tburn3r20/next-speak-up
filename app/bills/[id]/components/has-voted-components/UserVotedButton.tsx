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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { SupportBillButton } from "../SupportBillButton";

export function UserVotedButton() {
  const BillData = useBillPageStore((s) => s.billData);
  const [loading, setLoading] = useState(false);
  const setBillData = useBillPageStore((s) => s.setBillData);
  const userDeterminedVote = BillData.userVote.votePosition;
  const [open, setOpen] = useState(false);
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className={`w-full h-11 font-semibold flex items-center justify-center gap-2 ${
              isYeaVote
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isYeaVote ? (
              <>
                <ThumbsUp className="w-4 h-4" />
                You Voted: YEA
              </>
            ) : (
              <>
                <ThumbsDown className="w-4 h-4" />
                You Voted: NAY
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent
          hideCloseButton
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="shadow-none h-[90vh] max-w-7xl bg-transparent border-none"
        >
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle className="">
                {BillData?.legislation.title}
              </DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <div className="flex flex-col text-center  justify-between items-center">
            <div className="relative">
              <div className="absolute inset-0 z-0"></div>
              {/* Blurry overlay */}
              <div className="relative z-10 p-6 rounded-2xl bg-black/15 backdrop-blur-md ">
                <p className="text-white font-bold text-3xl">
                  {BillData.legislation.title}
                </p>
              </div>
            </div>

            <SupportBillButton
              bill={BillData.legislation}
              onVoteSuccess={() => setOpen(false)}
            />
            <div />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
