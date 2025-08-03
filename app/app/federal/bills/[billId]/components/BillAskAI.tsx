"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Minimize2, Eye, EyeOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBillState } from "../useBillState";
import { useChatStore } from "./Chatbot/useChatStore";
import { ChatSettings } from "./Chatbot/ChatSettings";
import { ChatMessages } from "./Chatbot/ChatMessages";
import { ChatInput } from "./Chatbot/ChatInput";
import { TextAnimate } from "@/components/magicui/text-animate";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { useBillPageStore } from "@/app/app/bills/[id]/useBillPageStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BillAskAI = ({ congress, type, number, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBillText, setShowBillText] = useState(false);

  const isBillLoaded = useBillState((state) => state.isBillLoaded);
  const isBillLoading = useBillState((state) => state.isBillLoading);
  const billText = useBillState((state) => state.billText);
  const setBillText = useBillState((state) => state.setBillText);
  const setBillLoading = useBillState((state) => state.setBillLoading);
  const setBillLoaded = useBillState((state) => state.setBillLoaded);
  const resetBillState = useBillState((state) => state.clearBill);
  const isMinimized = useChatStore((state) => state.isMinimized);
  const setMinimized = useChatStore((state) => state.setMinimized);
  const clearChat = useChatStore((state) => state.clearChat);
  const billSize = useBillPageStore((f) => f.billData?.legislation?.bill_size);
  // Clear state when component mounts or bill changes
  useEffect(() => {
    clearChat();
    resetBillState();
    setShowBillText(false);
  }, [clearChat, resetBillState, congress, type, number]);

  const fetchBillText = async () => {
    if (isBillLoading) return; // Prevent multiple simultaneous loads

    setBillLoading(true);
    toast.success("Loading bill text...", {
      position: "bottom-center",
    });
    try {
      const formattedType = type
        .toLowerCase()
        .replace(".", "")
        .replace(" ", "");
      const url = `/api/bills/text?congress=${congress}&type=${formattedType}&number=${number}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch bill text");
      }

      const data = await response.json();
      setBillText(data.text || "No text available for this bill");
      setBillLoaded(true);
      setIsOpen(true);
    } catch (err) {
      console.error("Error fetching bill text:", err);
      toast.error("Failed to load bill text. Please try again later.");
    } finally {
      setBillLoading(false);
    }
  };

  const handleChatClick = () => {
    if (!isBillLoaded && !isBillLoading) {
      fetchBillText();
    } else if (isBillLoaded) {
      setIsOpen(true);
      setMinimized(false);
    }
  };

  const toggleBillText = () => {
    setShowBillText(!showBillText);
  };

  if (billSize === "Very Long") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 lg:right-6 right-0 h-14 w-14 rounded-full shadow-lg"
              size="icon"
              variant="outline"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Open AI Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-lg font-bold p-2">
            Unforunately this bill is far too long to use AI on.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Chat button (minimized state)
  if (!isOpen || isMinimized) {
    return (
      <Button
        className="fixed bottom-6 lg:right-6 right-0 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        variant="outline"
        onClick={handleChatClick}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
    );
  }

  // Full chat window with optional bill text panel
  return (
    <div className="fixed bottom-6 lg:right-6 right-0 flex items-end space-x-4 z-20">
      {/* Bill Text Panel - Independent container */}
      {showBillText && isBillLoaded && (
        <div className="w-80 md:w-96 h-96 bg-background border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <h3 className="font-semibold text-sm">Bill Text</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleBillText}
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-4 h-full overflow-y-auto text-xs leading-relaxed bg-background">
            <pre className="whitespace-pre-wrap font-mono">
              {billText || "No bill text available"}
            </pre>
          </div>
        </div>
      )}

      {/* Chat Window - Independent container with its own dots */}
      <div className="w-96 bg-background border rounded-lg shadow-lg flex flex-col relative overflow-hidden">
        {/* Dots pattern only for this container */}
        <DotPattern
          className={cn(
            "absolute inset-0",
            "[mask-image:radial-gradient(180px_circle_at_center,white,transparent)]"
          )}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b relative z-10">
          <TextAnimate
            animation="blurInUp"
            by="character"
            className="text-semibold text-lg"
            once
          >
            Google Gemini + Bill
          </TextAnimate>

          <div className="flex items-center space-x-2">
            {/* Bill Text Toggle */}
            {isBillLoaded && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBillText}
                title={showBillText ? "Hide bill text" : "Show bill text"}
              >
                {showBillText ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Chat Settings */}
            <ChatSettings />

            {/* Minimize Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden flex flex-col h-96 relative z-10">
          <ChatMessages user={user} />
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default BillAskAI;
