"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";

interface CreatePostCommentProps {
  postId: string | number;
  userId: string;
}

const CreatePostComment = ({ postId, userId }: CreatePostCommentProps) => {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  const isMakingAPICall = useForumPostDetailsStore((f) => f.isMakingAPICall);
  const setIsMakingAPICall = useForumPostDetailsStore(
    (f) => f.setIsMakingAPICall
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) return;
    if (!userId) {
      toast.error("You must be logged in to comment");
      return;
    }

    // Check if another API call is already in progress
    if (isMakingAPICall) {
      toast.warning("Another operation is in progress. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setIsMakingAPICall(true);

    try {
      const response = await fetch("/api/forum/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: value.trim(),
          postId: postId,
          authorId: userId,
          // parentId is intentionally omitted for root-level comments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create comment");
      }

      const data = await response.json();
      setPostComments(data);

      // Clear the input
      setValue("");

      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error(error.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
      setIsMakingAPICall(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Only allow submit if not disabled
    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Disable if no text, submitting, or global API call is in progress
  const isDisabled = !value.trim() || isSubmitting || isMakingAPICall;

  if (!userId) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground border border-dashed rounded-lg">
        Please log in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Input
        className={`h-12 md:text-md border-primary/70 border-2 pr-12 ${
          isMakingAPICall && !isSubmitting ? "opacity-50" : ""
        }`}
        placeholder={
          isMakingAPICall && !isSubmitting
            ? "Processing..."
            : "Share your thoughts"
        }
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        value={value}
        disabled={isMakingAPICall} // Disable during any API call
      />
      <Button
        type="submit"
        disabled={isDisabled}
        className="absolute right-2 top-[7px] p-1 cursor-pointer"
        variant="ghost"
        size="icon"
      >
        <Send
          className={`text-primary hover:text-primary ${
            isSubmitting || isMakingAPICall ? "animate-pulse" : ""
          }`}
        />
      </Button>
    </form>
  );
};

export default CreatePostComment;
