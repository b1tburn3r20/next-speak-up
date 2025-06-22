"use client";
import { Legislation } from "@prisma/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useState } from "react";

interface BillSummariesProps {
  bill: Legislation;
  userId: string | null;
  isDyslexicFriendly: boolean;
}

const BillSummaries = ({
  bill,
  userId,
  isDyslexicFriendly,
}: BillSummariesProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleDyslexicPreference = async () => {
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

      const result = await response.json();
      console.log("Preference updated:", result);
      window.location.reload();
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
