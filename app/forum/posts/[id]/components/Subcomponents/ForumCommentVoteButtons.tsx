"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

interface UserVoteStatus {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
}

interface ForumCommentVoteButtonsProps {
  commentId: number;
  upvotes: number;
  downvotes: number;
  userVoteStatus?: UserVoteStatus | null;
  userId?: string;
  isUserAuthor?: boolean;
  disabled?: boolean;
}

const ForumCommentVoteButtons = ({
  commentId,
  upvotes,
  downvotes,
  userVoteStatus,
  userId,
  isUserAuthor = false,
  disabled,
}: ForumCommentVoteButtonsProps) => {
  // Local state to handle optimistic updates
  const [localVoteStatus, setLocalVoteStatus] = useState(userVoteStatus);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [isVoting, setIsVoting] = useState(false);
  const handleUpvote = async () => {
    if (!userId || isVoting || isUserAuthor) return;

    setIsVoting(true);

    // Optimistic update
    const wasUpvoted = localVoteStatus?.hasUpvoted;
    const wasDownvoted = localVoteStatus?.hasDownvoted;

    if (wasUpvoted) {
      // Remove upvote
      setLocalVoteStatus((prev) =>
        prev ? { ...prev, hasUpvoted: false } : null
      );
      setLocalUpvotes((prev) => prev - 1);
    } else {
      // Add upvote (and remove downvote if exists)
      setLocalVoteStatus((prev) => ({ hasUpvoted: true, hasDownvoted: false }));
      setLocalUpvotes((prev) => prev + 1);
      if (wasDownvoted) {
        setLocalDownvotes((prev) => prev - 1);
      }
    }

    try {
      const response = await fetch("/api/forum/comment-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          userId,
          type: wasUpvoted ? "remove-upvote" : "upvote",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();
      // Update with actual server response
      setLocalUpvotes(result.upvotes);
      setLocalDownvotes(result.downvotes);
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert optimistic update on error
      setLocalVoteStatus(userVoteStatus);
      setLocalUpvotes(upvotes);
      setLocalDownvotes(downvotes);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (!userId || isVoting || isUserAuthor) return;

    setIsVoting(true);

    // Optimistic update
    const wasUpvoted = localVoteStatus?.hasUpvoted;
    const wasDownvoted = localVoteStatus?.hasDownvoted;

    if (wasDownvoted) {
      // Remove downvote
      setLocalVoteStatus((prev) =>
        prev ? { ...prev, hasDownvoted: false } : null
      );
      setLocalDownvotes((prev) => prev - 1);
    } else {
      // Add downvote (and remove upvote if exists)
      setLocalVoteStatus((prev) => ({ hasUpvoted: false, hasDownvoted: true }));
      setLocalDownvotes((prev) => prev + 1);
      if (wasUpvoted) {
        setLocalUpvotes((prev) => prev - 1);
      }
    }

    try {
      const response = await fetch("/api/forum/comment-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          userId,
          type: wasDownvoted ? "remove-downvote" : "downvote",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();
      // Update with actual server response
      setLocalUpvotes(result.upvotes);
      setLocalDownvotes(result.downvotes);
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert optimistic update on error
      setLocalVoteStatus(userVoteStatus);
      setLocalUpvotes(upvotes);
      setLocalDownvotes(downvotes);
    } finally {
      setIsVoting(false);
    }
  };

  const hasUpvoted = localVoteStatus?.hasUpvoted || false;
  const hasDownvoted = localVoteStatus?.hasDownvoted || false;

  // Show upvoted state when user is author (visual indication)
  const showUpvoted = isUserAuthor || hasUpvoted;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 gap-1 ${
          showUpvoted ? "text-primary" : ""
        } disabled:opacity-50`}
        onClick={handleUpvote}
        disabled={!userId || isVoting || isUserAuthor || disabled}
        title={isUserAuthor ? "You cannot vote on your own comment" : undefined}
      >
        <ArrowUp className="h-3 w-3" />
        <span>{localUpvotes}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 gap-1 ${
          hasDownvoted && !isUserAuthor ? "text-destructive" : ""
        } disabled:opacity-50`}
        onClick={handleDownvote}
        disabled={!userId || isVoting || isUserAuthor || disabled}
        title={isUserAuthor ? "You cannot vote on your own comment" : undefined}
      >
        <ArrowDown className="h-3 w-3" />
        <span>{localDownvotes}</span>
      </Button>
    </div>
  );
};

export default ForumCommentVoteButtons;
