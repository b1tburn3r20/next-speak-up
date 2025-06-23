"use client";
import { Legislation } from "@prisma/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { useBillPageStore } from "../useBillPageStore";
import { useState } from "react";

interface BillSummariesProps {
  userId: string | null;
}

const BillSummaries = ({ userId }: BillSummariesProps) => {
  const bill = useBillPageStore((s) => s.billData.legislation);
  const [isLoading, setIsLoading] = useState(false);
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);
  const setIsDyslexicFriendly = useBillPageStore(
    (l) => l.setIsDyslexicFriendly
  );
  const toggleDyslexicPreference = async () => {
    setIsDyslexicFriendly(!isDyslexicFriendly);
    if (!userId) {
      console.warn("No user ID provided");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user-preferance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "dyslexic_friendly",
          value: String(!isDyslexicFriendly),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to update dyslexic preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`text-justify text-xl leading-relaxed ${
            isDyslexicFriendly && "font-dyslexic"
          }`}
        >
          {bill.ai_summary}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={toggleDyslexicPreference}
          disabled={!userId || isLoading}
          className={` ${isDyslexicFriendly && "font-dyslexic"}`}
        >
          {isLoading
            ? "Setting..."
            : isDyslexicFriendly
            ? "Disable Dyslexic Mode"
            : "Enable Dyslexic Mode"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BillSummaries;
