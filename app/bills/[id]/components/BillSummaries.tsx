"use client";
import { Legislation } from "@prisma/client";
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

interface BillSummariesProps {
  userId: string | null;
}

const BillSummaries = ({ userId }: BillSummariesProps) => {
  const bill = useBillPageStore((s) => s.billData.legislation);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);
  const setIsDyslexicFriendly = useBillPageStore(
    (l) => l.setIsDyslexicFriendly
  );

  // Detect if user is on mobile/touch device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const MenuContent = () => (
    <ContextMenuItem
      onClick={toggleDyslexicPreference}
      disabled={!userId || isLoading}
      className={`${isDyslexicFriendly && "font-dyslexic"}`}
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

  const DropdownContent = () => (
    <DropdownMenuItem
      onClick={toggleDyslexicPreference}
      disabled={!userId || isLoading}
      className={`${isDyslexicFriendly && "font-dyslexic"}`}
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
  );

  return (
    <div className="relative">
      {/* Mobile: Show dropdown menu button */}
      {isMobile && (
        <div className="absolute top-2 right-2 z-10">
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
              <DropdownContent />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Desktop: Keep context menu */}
      {!isMobile ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`text-justify text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-relaxed lg:leading-relaxed p-4 sm:p-6 ${
                isDyslexicFriendly && "font-dyslexic"
              }`}
            >
              {bill.ai_summary}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <MenuContent />
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        /* Mobile: Just show the text without context menu */
        <div
          className={`text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-relaxed lg:leading-relaxed p-4 sm:p-6 pr-12 ${
            isDyslexicFriendly && "font-dyslexic"
          }`}
        >
          {bill.ai_summary}
        </div>
      )}
    </div>
  );
};

export default BillSummaries;
