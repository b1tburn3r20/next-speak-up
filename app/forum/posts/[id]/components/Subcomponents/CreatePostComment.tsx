"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
import { useLoginStore } from "@/app/navbar/useLoginStore";
import { useDialogStore } from "@/app/stores/useDialogStore";
import UsernameSelectDialog from "@/app/GeneralComponents/Onboarding/components/componentsA/UsernameSelectDialog";

interface CreatePostCommentProps {
  postId: string | number;
  userId: string | null;
}

const CreatePostComment = ({ postId, userId }: CreatePostCommentProps) => {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);
  const setIsUsernameSelectDialogOpen = useDialogStore(
    (state) => state.setIsUsernameSelectDialogOpen
  );
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  const isMakingAPICall = useForumPostDetailsStore((f) => f.isMakingAPICall);
  const setIsMakingAPICall = useForumPostDetailsStore(
    (f) => f.setIsMakingAPICall
  );
  const isPostDeleted = useForumPostDetailsStore((f) => f.isPostDeleted);
  const isPostLocked = useForumPostDetailsStore((f) => f.isPostLocked);
  const userName = useForumPostDetailsStore((f) => f.userName);
  const setUserName = useForumPostDetailsStore((f) => f.setUserName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) return;

    if (!userId) {
      toast.error("You must be logged in to comment");
      setIsLoginDialogOpen(true);
      return;
    }

    if (!userName) {
      toast.error("You must set a username to comment");
      setIsLoginDialogOpen(true); // This should open a dialog to set username
      return;
    }

    // Check if post is deleted or locked
    if (isPostDeleted || isPostLocked) {
      toast.error(
        isPostDeleted
          ? "Cannot comment on a deleted post"
          : "Cannot comment on a locked post"
      );
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

  const isDisabled =
    !value.trim() ||
    isSubmitting ||
    isMakingAPICall ||
    isPostDeleted ||
    isPostLocked;

  const isInputDisabled =
    isSubmitting || isMakingAPICall || isPostDeleted || isPostLocked;

  if (!userId) {
    return (
      <Button
        variant="outline"
        className="w-full p-4 h-auto text-muted-foreground border-dashed hover:border-primary/50 hover:text-primary transition-colors"
        onClick={() => setIsLoginDialogOpen(true)}
        disabled={isPostDeleted || isPostLocked}
      >
        {isPostDeleted
          ? "Post has been deleted"
          : isPostLocked
          ? "Post is locked"
          : "Please log in to comment"}
      </Button>
    );
  }

  if (!userName) {
    return (
      <>
        <Button
          variant="outline"
          className="w-full p-4 h-auto text-muted-foreground border-dashed hover:border-primary/50 hover:text-primary transition-colors"
          onClick={() => setIsUsernameSelectDialogOpen(true)}
          disabled={isPostDeleted || isPostLocked}
        >
          {isPostDeleted
            ? "Post has been deleted"
            : isPostLocked
            ? "Post is locked"
            : "Please set a username to comment"}
        </Button>
        <UsernameSelectDialog
          onUsernameCreation={(username) => setUserName(username)}
        />
      </>
    );
  }

  // Show different UI when post is deleted or locked
  if (isPostDeleted || isPostLocked) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground bg-muted/30 rounded-md border border-dashed">
        {isPostDeleted
          ? "This post has been deleted. Comments are no longer allowed."
          : "This post is locked. Comments are no longer allowed."}
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
        disabled={isInputDisabled}
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
