"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Legislation } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { BillVote } from "@/lib/services/legislation_two";
import { toast } from "sonner";
import { MemberVoteAvatars } from "./components/MemberVoteAvatars";
import { VoteCards } from "./components/VoteCards";
import { VoteFederalBillSummary } from "./components/VoteFederalBillSummary";
import { NextVoteDrawer } from "./components/NextVoteDrawer";

interface UserFederalLegislationVoteModalProps {
  bill: Legislation;
  searchParams: { vote?: string };
  votes?: BillVote[];
  userInfo: {
    id: string;
    name: string;
    image: string;
  };
}

export function UserFederalLegislationVoteModal({
  bill,
  searchParams,
  votes,
  userInfo,
}: UserFederalLegislationVoteModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [currentVote, setCurrentVote] = useState<boolean | null>(null);
  const [loadingInitialVote, setLoadingInitialVote] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const initialLoadDone = useRef(false);
  const drawerTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle dialog open/close based on URL
  useEffect(() => {
    setIsOpen(searchParams.vote === "true");
  }, [searchParams.vote]);

  // Standalone drawer timer effect - completely isolated
  useEffect(() => {
    if (showAvatars) {
      if (drawerTimer.current) {
        clearTimeout(drawerTimer.current);
      }

      drawerTimer.current = setTimeout(() => {
        setIsDrawerOpen(true);
      }, 2300);
    }

    return () => {
      if (drawerTimer.current) {
        clearTimeout(drawerTimer.current);
      }
    };
  }, [showAvatars]);

  // Check for existing user vote on initial load
  useEffect(() => {
    if (!isOpen || !bill.name_id || initialLoadDone.current) return;

    const checkExistingVote = async () => {
      setLoadingInitialVote(true);
      try {
        const response = await fetch(
          `/api/bills/vote?legislationNameId=${bill.name_id}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.vote) {
            // Set the current vote from the API
            setCurrentVote(data.vote.votePosition === "YEA");

            // Show avatars after a short delay to allow animations to complete
            setTimeout(() => {
              setShowAvatars(true);
            }, 300);
          }
        }
      } catch (error) {
        console.error("Failed to fetch existing vote:", error);
      } finally {
        setLoadingInitialVote(false);
        initialLoadDone.current = true;
      }
    };

    checkExistingVote();
  }, [isOpen, bill.name_id]);

  const handleClose = () => {
    router.push(`/federal/bills/${bill.name_id}`);
  };

  const handleVote = async (isYesVote: boolean) => {
    // Prevent voting while loading or already voting
    if (isVoting || loadingInitialVote) return;

    // If this is the same vote they already have, don't resubmit
    if (isYesVote === currentVote && currentVote !== null) return;

    // Optimistically update UI state
    setIsVoting(true);

    // Store previous vote for error recovery
    const previousVote = currentVote;
    setCurrentVote(isYesVote);

    try {
      const response = await fetch("/api/bills/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legislationNameId: bill.name_id,
          vote: isYesVote ? "YEA" : "NAY",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit vote");
      }

      // Show avatars (if not already visible)
      setShowAvatars(true);
      setTimeout(() => {
        setIsDrawerOpen(true);
      }, 2000);

      // Drawer will open automatically via the standalone useEffect
    } catch (error) {
      // Revert to previous state on error
      setCurrentVote(previousVote);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to record vote. Please try again."
      );
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[80vw] bg-transparent border-none shadow-none overflow-visible [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>{bill.title}</DialogTitle>
          </VisuallyHidden>
          <DialogHeader className="text-center" />

          <div className="relative flex items-center justify-center">
            <VoteCards
              bill={bill}
              votes={votes}
              onVote={handleVote}
              isVoting={isVoting || loadingInitialVote}
              currentVote={currentVote}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%]">
              <div className="bg-card text-3xl font-dyslexic p-2 rounded-t-lg text-center pt-4">
                {bill.title}
              </div>
              <VoteFederalBillSummary
                className="border-none shadow-none rounded-t-none"
                bill={bill}
                hideDictionary={true}
              />
            </div>
            {votes?.[0]?.memberVotes && currentVote !== null && (
              <MemberVoteAvatars
                memberVotes={votes[0].memberVotes}
                userVoteDirection={currentVote}
                show={showAvatars}
                userImage={userInfo.image}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* The drawer at the bottom */}
      <NextVoteDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </>
  );
}
