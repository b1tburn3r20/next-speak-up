"use client";
import React, { useEffect } from "react";
import { MessageCircle, Minimize2 } from "lucide-react";
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

const BillAskAI = ({ congress, type, number, user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isBillLoaded = useBillState((state) => state.isBillLoaded);
  const isBillLoading = useBillState((state) => state.isBillLoading);
  const setBillText = useBillState((state) => state.setBillText);
  const setBillLoading = useBillState((state) => state.setBillLoading);
  const setBillLoaded = useBillState((state) => state.setBillLoaded);
  const isMinimized = useChatStore((state) => state.isMinimized);
  const setMinimized = useChatStore((state) => state.setMinimized);
  const clearChat = useChatStore((state) => state.clearChat);

  useEffect(() => {
    clearChat();
  }, [clearChat]);
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
      toast.success("Bill text loaded!", {
        position: "bottom-center",
      });
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

  // Chat button (minimized state)
  if (!isOpen || isMinimized) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={handleChatClick}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
    );
  }

  // Full chat window
  return (
    <div className="fixed bottom-6 right-6 w-96 bg-background border rounded-lg shadow-lg flex flex-col">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(180px_circle_at_center,white,transparent)]"
        )}
      />
      <div className="flex items-center justify-between p-4 border-b">
        <TextAnimate
          animation="blurInUp"
          by="character"
          className="text-semibold text-lg"
          once
        >
          Get better understanding
        </TextAnimate>

        <div className="flex items-center space-x-2">
          <ChatSettings />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatMessages user={user} />
        <ChatInput />
      </div>
    </div>
  );
};

export default BillAskAI;
