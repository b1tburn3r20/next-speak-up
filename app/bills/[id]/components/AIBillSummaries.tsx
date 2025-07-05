"use client";

import Summary from "./Summary";
import AiSummaryVersionSelector from "./AISummaryVersionSelector";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, EyeOff } from "lucide-react";

import { useBillPageStore } from "../useBillPageStore";
import { useState, useEffect } from "react";

interface AIBillSummariesProps {
  userId: string | null;
}

const AIBillSummaries = ({ userId }: AIBillSummariesProps) => {
  const bill = useBillPageStore((s) => s.billData?.legislation);
  const currentAiSummary = useBillPageStore((s) => s.currentAiSummary);
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);
  const setCurrentAiSummaryText = useBillPageStore(
    (f) => f.setCurrentAISummaryText
  );
  const setIsDyslexicFriendly = useBillPageStore(
    (s) => s.setIsDyslexicFriendly
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update current AI summary text when bill or currentAiSummary changes
  useEffect(() => {
    const aiSummary = bill?.aiSummaries?.find((s) => {
      const summaryDate = new Date(s.actionDate || s.createdAt)
        .toISOString()
        .split("T")[0];
      return summaryDate === currentAiSummary;
    });
    setCurrentAiSummaryText(aiSummary?.text);
  }, [bill, currentAiSummary]);

  const toggleDyslexicPreference = async () => {
    setIsDyslexicFriendly(!isDyslexicFriendly);
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/user-preferance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "dyslexic_friendly",
          value: String(!isDyslexicFriendly),
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error("Failed to update dyslexic preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSummaryText = () => {
    const aiSummary = bill?.aiSummaries?.find((s) => {
      const summaryDate = new Date(s.actionDate || s.createdAt)
        .toISOString()
        .split("T")[0];
      return summaryDate === currentAiSummary;
    });

    return aiSummary?.text || "No AI summary available for this legislation.";
  };

  const MenuContent = () => (
    <ContextMenuItem
      onClick={toggleDyslexicPreference}
      disabled={!userId || isLoading}
      className={isDyslexicFriendly ? "font-dyslexic" : ""}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Setting...
        </>
      ) : isDyslexicFriendly ? (
        <>
          <EyeOff className="mr-2 h-4 w-4" />
          Disable Dyslexic Mode
        </>
      ) : (
        <>
          <Eye className="mr-2 h-4 w-4" />
          Enable Dyslexic Mode
        </>
      )}
    </ContextMenuItem>
  );

  return (
    <div className="relative">
      {/* AI Summary Version Selector */}
      <AiSummaryVersionSelector />

      {/* Mobile dropdown menu */}
      {/* {isMobile && (
        <div className="absolute top-0 right-0 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-muted backdrop-blur-sm shadow-sm hover:bg-white/90"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open options menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={toggleDyslexicPreference}
                disabled={!userId || isLoading}
                className={isDyslexicFriendly ? "font-dyslexic" : ""}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Setting...
                  </>
                ) : isDyslexicFriendly ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Disable Dyslexic Mode
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Enable Dyslexic Mode
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )} */}

      {/* Summary content */}
      {!isMobile ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`text-justify text-base sm:text-lg lg:text-xl leading-relaxed p-0 sm:p-6 ${
                isDyslexicFriendly ? "font-dyslexic" : ""
              }`}
            >
              <Summary text={getSummaryText()} />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <MenuContent />
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <div
          className={`text-base sm:text-lg lg:text-xl leading-relaxed p-0 sm:p-6 pr-0 sm:pr-6 ${
            isDyslexicFriendly ? "font-dyslexic" : ""
          }`}
        >
          <Summary text={getSummaryText()} />
        </div>
      )}
    </div>
  );
};

export default AIBillSummaries;
