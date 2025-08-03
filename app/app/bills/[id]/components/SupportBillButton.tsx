"use client";

import React, { useEffect, useRef, useState } from "react";
import { Legislation } from "@prisma/client";
import { X, Check } from "lucide-react";
import { BillVote } from "@/lib/services/legislation_two";
import {
  initializeCards,
  setupHoverAnimations,
  playVoteAnimation,
} from "@/app/app/federal/bills/[billId]/components/UserVote/components/animations";
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
  onVoteSuccess,
  className,
}: VoteCardsProps) {
  const noCardRef = useRef<HTMLDivElement>(null);
  const yesCardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const setBillData = useBillPageStore((d) => d.setBillData);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const noCard = noCardRef.current;
    const yesCard = yesCardRef.current;

    initializeCards(noCard, yesCard);

    if (!isMobile && noCard && yesCard) {
      const cleanYes = setupHoverAnimations(yesCard, noCard, 8);
      const cleanNo = setupHoverAnimations(noCard, yesCard, -8);
      return () => {
        cleanYes?.();
        cleanNo?.();
      };
    }
  }, [isMobile]);

  const handleVote = async (isYes: boolean) => {
    if (isLoading) return;
    setIsLoading(true);

    const thisCard = isYes ? yesCardRef.current : noCardRef.current;
    const otherCard = isYes ? noCardRef.current : yesCardRef.current;

    playVoteAnimation(thisCard, otherCard, isYes);

    try {
      const res = await fetch("/api/bills/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legislationNameId: bill.name_id,
          vote: isYes ? "YEA" : "NAY",
        }),
      });

      const data = await res.json();
      setBillData(data.data);

      if (onVoteSuccess) setTimeout(onVoteSuccess, 1000);
    } catch (err) {
      console.error("Vote failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const CardContent = ({ children }: { children: React.ReactNode }) =>
    isDarkMode ? (
      <MagicCard className="flex items-center justify-center h-full">
        {children}
      </MagicCard>
    ) : (
      <div className="flex items-center justify-center h-full">{children}</div>
    );

  const cardSize = {
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
        className={`z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-red-500 transition-opacity duration-500 ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{ ...cardSize, transformOrigin: "center center" }}
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
        className={`z-20 rounded-lg shadow-2xl cursor-pointer flex-shrink-0 dark:bg-card bg-green-500 transition-opacity duration-500 ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{ ...cardSize, transformOrigin: "center center" }}
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
