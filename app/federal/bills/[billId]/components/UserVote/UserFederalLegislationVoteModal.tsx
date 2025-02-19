"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Legislation } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoteFederalBillSummary } from "./components/VoteFederalBillSummary";
import { VoteFederalBillNo } from "./components/VoteFederalBillNo";
import { VoteFederalBillYes } from "./components/VoteFederalBillYes";

interface UserFederalLegislationVoteModalProps {
  bill: Legislation;
  searchParams: { vote?: string };
}

export function UserFederalLegislationVoteModal({
  bill,
  searchParams,
}: UserFederalLegislationVoteModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    setIsOpen(searchParams.vote === "true");
  }, [searchParams.vote]);

  const handleClose = () => {
    router.push(`/federal/bills/${bill.name_id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[80vw] h-[90vh]">
        <DialogHeader>
          <DialogTitle>{bill.title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <VoteFederalBillYes
            bill={bill}
            isSelected={selectedVote === "yes"}
            onSelect={() => setSelectedVote("yes")}
          />
          <VoteFederalBillSummary bill={bill} />

          <VoteFederalBillNo
            bill={bill}
            isSelected={selectedVote === "no"}
            onSelect={() => setSelectedVote("no")}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            className="w-full border"
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
