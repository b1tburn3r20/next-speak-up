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
import { useBillPageStore } from "../useBillPageStore";

interface VoteCardsProps {
  bill: Legislation;
  votes?: BillVote[];
  onVoteSuccess?: () => void;
  className?: string;
}

export function SupportBillButton({
  bill,
  votes,
  onVoteSuccess,
  className,
}: VoteCardsProps) {
  const noCardRef = useRef<HTMLDivElement>(null);
  const yesCardRef = useRef<HTMLDivElement>(null);
  const [cardsReady, setCardsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const setBillData = useBillPageStore((d) => d.setBillData);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

        // Setup hover animations (only on desktop)
        if (noCard && yesCard && !isMobile) {
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
  }, [isMobile]);

  const handleVote = async (isYesVote: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    // Play animation
    playVoteAnimation(
      isYesVote ? yesCardRef.current : noCardRef.current,
      isYesVote ? noCardRef.current : yesCardRef.current,
      isYesVote
    );

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

      // Call success callback after successful vote
      if (onVoteSuccess) {
        // Small delay to let animation finish
        setTimeout(() => {
          onVoteSuccess();
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
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

  // Mobile dimensions
  const mobileCardStyle = {
    width: isMobile ? "140px" : "250px",
    height: isMobile ? "180px" : "400px",
  };

  const iconSize = isMobile ? "w-16 h-16" : "w-48 h-48";

  return (
    <div
      className={`flex justify-between items-center w-full ${
        isMobile ? "gap-2" : "gap-4"
      } ${className || ""}`}
    >
      <div
        ref={noCardRef}
        onClick={() => handleVote(false)}
        className={`z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-red-500 transition-opacity ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{
          ...mobileCardStyle,
          transformOrigin: "center center",
          pointerEvents: cardsReady && !isLoading ? "auto" : "none",
        }}
      >
        <CardContent>
          <X
            className={`${iconSize} dark:text-red-500 text-background stroke-2`}
          />
        </CardContent>
      </div>

      <div className={`${isMobile ? "w-[20%]" : "w-[70%]"}`} />

      <div
        ref={yesCardRef}
        onClick={() => handleVote(true)}
        className={`z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-green-500 transition-opacity ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{
          ...mobileCardStyle,
          transformOrigin: "center center",
          pointerEvents: cardsReady && !isLoading ? "auto" : "none",
        }}
      >
        <CardContent>
          <Check
            className={`${iconSize} dark:text-green-500 text-background stroke-2`}
          />
        </CardContent>
      </div>
    </div>
  );
}
