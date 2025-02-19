import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { useChatStore } from "./useChatStore";
import { useBillState } from "../../useBillState";

const DEFAULT_SETTINGS = {
  longResponses: false,
  advancedLanguage: false,
  contextSize: 10,
};

export const ChatInput = () => {
  const [message, setMessage] = React.useState("");
  const addMessage = useChatStore((state) => state.addMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const getContextMessages = useChatStore((state) => state.getContextMessages);
  const settings = useChatStore((state) => state.settings);
  const billText = useBillState((state) => state.billText);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    addMessage(message, "user", false);
    setMessage("");

    // Show typing indicator
    setTyping(true);

    try {
      const contextMessages = getContextMessages();
      const currentSettings = { ...DEFAULT_SETTINGS, ...settings };

      const response = await fetch("/api/bills/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: contextMessages.concat({
            role: "user",
            content: message,
          }),
          billText: useBillState.getState().getBillText(),
          settings: currentSettings,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        addMessage(
          "I'm receiving too many requests right now. Please try again in a moment.",
          "assistant",
          true
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      addMessage(data.content, "assistant", true); // Set shouldAnimate to true
    } catch (error) {
      console.error("AI Chat Error:", error);
      addMessage(
        "Sorry, I encountered an error. Please try again.",
        "assistant",
        true
      );
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex items-end space-x-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question about this bill..."
          className="min-h-[60px] max-h-[200px]"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};
