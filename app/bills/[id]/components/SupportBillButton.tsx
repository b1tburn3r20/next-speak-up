"use client";

import React, { useEffect, useRef, useState } from "react";
import { Legislation } from "@prisma/client";
import { X, Check } from "lucide-react";
import { BillVote } from "@/lib/services/legislation_two";

import {
  initializeCards,
  createEntryAnimations,
  setupHoverAnimations,
  playVoteAnimation,
} from "@/app/federal/bills/[billId]/components/UserVote/components/animations";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import { voteOnLegislation } from "@/lib/services/bill-voting";
import { useBillPageStore } from "../useBillPageStore";

interface VoteCardsProps {
  bill: Legislation;
  votes?: BillVote[];
}

export function SupportBillButton({ bill, votes }: VoteCardsProps) {
  const noCardRef = useRef<HTMLDivElement>(null);
  const yesCardRef = useRef<HTMLDivElement>(null);
  const [cardsReady, setCardsReady] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const setBillData = useBillPageStore((d) => d.setBillData);
  useEffect(() => {
    const noCard = noCardRef.current;
    const yesCard = yesCardRef.current;
    let cleanupFunctions: Array<() => void> = [];

    // Initialize cards
    initializeCards(noCard, yesCard);

    // Create entry animations with hover setup in completion
    const timeline = createEntryAnimations(noCard, yesCard, {
      onComplete: () => {
        setCardsReady(true);

        // Setup hover animations
        if (noCard && yesCard) {
          const cleanupYesHover = setupHoverAnimations(yesCard, noCard, 8);
          const cleanupNoHover = setupHoverAnimations(noCard, yesCard, -8);

          if (cleanupYesHover) cleanupFunctions.push(cleanupYesHover);
          if (cleanupNoHover) cleanupFunctions.push(cleanupNoHover);
        }
      },
    });

    return () => {
      timeline?.kill();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, []);

  const handleVote = async (isYesVote: boolean) => {
    playVoteAnimation(
      isYesVote ? yesCardRef.current : noCardRef.current,
      isYesVote ? noCardRef.current : yesCardRef.current,
      isYesVote
    );
    let vote;
    if (isYesVote) {
      vote = "YEA";
    } else {
      vote = "NAY";
    }
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
      console.error("Failed to update dyslexic preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const CardContent = ({ children }: { children: React.ReactNode }) => {
    return isDarkMode ? (
      <MagicCard className="flex items-center justify-center h-full">
        {children}
      </MagicCard>
    ) : (
      <div className="flex items-center justify-center h-full">{children}</div>
    );
  };

  return (
    <div className="flex justify-between items-center w-full gap-4">
      <div
        ref={noCardRef}
        onClick={() => handleVote(false)}
        className="w-[250px] h-[400px] z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-red-500"
        style={{
          transformOrigin: "center center",
          pointerEvents: cardsReady ? "auto" : "none",
        }}
      >
        <CardContent>
          <X className="w-48 h-48 dark:text-red-500 text-background stroke-2" />
        </CardContent>
      </div>

      <div className="w-[70%]" />

      <div
        ref={yesCardRef}
        onClick={() => handleVote(true)}
        className="w-[250px] h-[400px] z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-green-500"
        style={{
          transformOrigin: "center center",
          pointerEvents: cardsReady ? "auto" : "none",
        }}
      >
        <CardContent>
          <Check className="w-48 h-48 dark:text-green-500 text-background stroke-2" />
        </CardContent>
      </div>
    </div>
  );
}
