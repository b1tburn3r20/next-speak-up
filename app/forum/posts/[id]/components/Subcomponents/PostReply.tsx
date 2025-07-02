"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send } from "lucide-react";
import { useState } from "react";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";

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

  // Get the global API call state from the store
  const isMakingAPICall = useForumPostDetailsStore(
    (state) => state.isMakingAPICall
  );

  const handleSubmit = async () => {
    if (!replyText.trim() || isMakingAPICall) return;

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
    // Submit on Ctrl/Cmd + Enter (only if not disabled)
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isDisabled) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape (only if not making API call)
    if (e.key === "Escape" && !isMakingAPICall) {
      e.preventDefault();
      onCancel();
    }
  };

  // Disable if text is empty, currently submitting, or global API call is in progress
  const isDisabled = !replyText.trim() || isSubmitting || isMakingAPICall;

  return (
    <div className="relative">
      {/* Mobile-first container */}
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        {/* Header with replying to indicator */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Replying to{" "}
              <span className="font-medium text-foreground">{replyingTo}</span>
            </div>
            {/* Show loading indicator when global API call is in progress */}
            {isMakingAPICall && !isSubmitting && (
              <div className="text-xs text-muted-foreground">
                (Processing...)
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isMakingAPICall} // Disable cancel button during API calls
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
            disabled={isMakingAPICall} // Disable textarea during API calls
            className={`
              min-h-[80px] sm:min-h-[100px] 
              resize-none border-0 
              focus-visible:ring-0 
              focus-visible:ring-offset-0
              p-0 
              text-sm
              transition-all duration-200
              ${isFocused ? "min-h-[120px] sm:min-h-[140px]" : ""}
              ${isMakingAPICall ? "opacity-50 cursor-not-allowed" : ""}
            `}
            autoFocus
          />
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t bg-muted/10">
          {/* Character count / help text */}
          <div className="text-xs text-muted-foreground hidden sm:block">
            {isFocused && !isMakingAPICall && (
              <span>
                {replyText.length > 0 && `${replyText.length} characters • `}
                Ctrl+Enter to submit
              </span>
            )}
            {isMakingAPICall && (
              <span className="text-orange-500">
                Please wait for the current operation to complete
              </span>
            )}
          </div>

          {/* Mobile character count */}
          <div className="text-xs text-muted-foreground sm:hidden">
            {replyText.length > 0 && !isMakingAPICall && `${replyText.length}`}
            {isMakingAPICall && (
              <span className="text-orange-500">Processing...</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isMakingAPICall} // Disable cancel during API calls
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
              {isSubmitting || isMakingAPICall ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-1" />
                  <span className="hidden sm:inline">
                    {isSubmitting ? "Posting..." : "Processing..."}
                  </span>
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
      {isFocused && !isMakingAPICall && (
        <div className="sm:hidden mt-2 text-xs text-muted-foreground text-center">
          Tap outside to minimize • Escape to cancel
        </div>
      )}
    </div>
  );
};

export default PostReply;
