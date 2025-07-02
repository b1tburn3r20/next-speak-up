"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send } from "lucide-react";
import { useState } from "react";

interface PostReplyProps {
  commentId: number;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
  replyingTo: string;
}

const PostReply = ({
  commentId,
  onSubmit,
  onCancel,
  replyingTo,
}: PostReplyProps) => {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(replyText);
      setReplyText("");
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const isDisabled = !replyText.trim() || isSubmitting;

  return (
    <div className="relative">
      {/* Mobile-first container */}
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        {/* Header with replying to indicator */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Replying to{" "}
              <span className="font-medium text-foreground">
                u/{replyingTo}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Textarea container */}
        <div className="p-2 sm:p-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What are your thoughts?"
            className={`
              min-h-[80px] sm:min-h-[100px] 
              resize-none border-0 
              focus-visible:ring-0 
              focus-visible:ring-offset-0
              p-0 
              text-sm
              transition-all duration-200
              ${isFocused ? "min-h-[120px] sm:min-h-[140px]" : ""}
            `}
            autoFocus
          />
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t bg-muted/10">
          {/* Character count / help text */}
          <div className="text-xs text-muted-foreground hidden sm:block">
            {isFocused && (
              <span>
                {replyText.length > 0 && `${replyText.length} characters • `}
                Ctrl+Enter to submit
              </span>
            )}
          </div>

          {/* Mobile character count */}
          <div className="text-xs text-muted-foreground sm:hidden">
            {replyText.length > 0 && `${replyText.length}`}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`
                h-7 px-3 text-xs 
                transition-all duration-200
                ${!isDisabled ? "bg-primary hover:bg-primary/90" : ""}
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-1" />
                  <span className="hidden sm:inline">Posting...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Comment</span>
                  <span className="sm:hidden">Post</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile keyboard helper */}
      {isFocused && (
        <div className="sm:hidden mt-2 text-xs text-muted-foreground text-center">
          Tap outside to minimize • Escape to cancel
        </div>
      )}
    </div>
  );
};

export default PostReply;
