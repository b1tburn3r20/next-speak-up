import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bot, AlertCircle } from "lucide-react";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBillState } from "../../useBillState";
import { useChatStore } from "./useChatStore";
import { ScrollArea } from "@/components/ui/scroll-area";

const GREETING_MESSAGE = "Hey, got any questions?";

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const ChatMessages = ({ user }) => {
  const messages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.isTyping);
  const setTyping = useChatStore((state) => state.setTyping);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessageAnimated = useChatStore((state) => state.setMessageAnimated);
  const hasInitialized = useChatStore((state) => state.hasInitialized);
  const setInitialized = useChatStore((state) => state.setInitialized);
  const settings = useChatStore((state) => state.settings);
  const messagesEndRef = React.useRef(null);
  const hasAddedGreeting = React.useRef(false);
  const [retryMessage, setRetryMessage] = React.useState(null);

  const isHistoryTrimmed = messages.length >= settings.contextSize;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (!hasInitialized && !hasAddedGreeting.current && messages.length === 0) {
      hasAddedGreeting.current = true;
      addMessage(GREETING_MESSAGE, "assistant", true);
      setInitialized();
    }
  }, [hasInitialized, messages.length, addMessage, setInitialized]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleAnimationComplete = (messageId) => {
    setMessageAnimated(messageId);
  };

  const sendMessage = async (content, isRetry = false) => {
    if (!isRetry) {
      addMessage(content, "user");
    }
    setTyping(true);
    setRetryMessage(null);

    try {
      const contextMessages = useChatStore.getState().getContextMessages();
      const billText = useBillState.getState().billText;

      const response = await fetch("/api/bills/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: contextMessages.concat({
            role: "user",
            content,
          }),
          billText,
          settings: useChatStore.getState().settings,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setRetryMessage(content);
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

      addMessage(data.content, "assistant", true);
    } catch (error) {
      console.error("Chat error:", error);
      addMessage(
        "Sorry, I encountered an error. Please try again.",
        "assistant",
        true
      );
    } finally {
      setTyping(false);
    }
  };

  const handlePromptSelect = (prompt) => sendMessage(prompt);

  return (
    <ScrollArea className="flex flex-col h-[350px] overflow-y-auto">
      <div className="flex-1 ">
        <div className="flex flex-col space-y-4 p-4">
          {isHistoryTrimmed && (
            <Alert variant="default" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some earlier messages have been removed to keep the chat history
                manageable
              </AlertDescription>
            </Alert>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </Avatar>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.role === "assistant" &&
                message.shouldAnimate &&
                !message.hasAnimated ? (
                  <TypingAnimation
                    className="text-sm font-normal"
                    duration={10}
                    onComplete={() => handleAnimationComplete(message.id)}
                  >
                    {message.content}
                  </TypingAnimation>
                ) : (
                  <p className="text-sm font-normal tracking-[-0.02em]">
                    {message.content}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 rounded-lg w-8 bg-muted flex items-center justify-center">
                  {user?.user?.image ? (
                    <AvatarImage
                      src={user.user.image}
                      alt={user.user.name || "User"}
                    />
                  ) : (
                    <AvatarFallback className="text-sm">
                      {getInitials(user?.user?.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length <= 1 && (
        <div>
          <SuggestedPrompts onPromptSelect={handlePromptSelect} />
          <Alert
            variant="default"
            className="rounded-none flex items-center justify-center border-b-0 mt-4 bg-muted/50 text-center"
          >
            <div className="flex items-center justify-center gap-2 self-baseline">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-muted-foreground">
                This feature is using AI, results subject to discretion.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
    </ScrollArea>
  );
};

export default ChatMessages;
