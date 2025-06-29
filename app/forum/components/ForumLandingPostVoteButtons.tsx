"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

interface UserVoteStatus {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
}

interface ForumLandingPostVoteButtonsProps {
  postId: number;
  userId?: string;
  netVotes: number;
  userVoteStatus?: UserVoteStatus | null;
}

const ForumLandingPostVoteButtons = ({
  postId,
  userId,
  netVotes,
  userVoteStatus,
}: ForumLandingPostVoteButtonsProps) => {
  // Local state to handle optimistic updates
  const [localVoteStatus, setLocalVoteStatus] = useState(userVoteStatus);
  const [localNetVotes, setLocalNetVotes] = useState(netVotes);
  const [isVoting, setIsVoting] = useState(false);

  const handleUpvote = async () => {
    if (!userId || isVoting) return;

    setIsVoting(true);

    // Optimistic update
    const wasUpvoted = localVoteStatus?.hasUpvoted;
    const wasDownvoted = localVoteStatus?.hasDownvoted;

    if (wasUpvoted) {
      // Remove upvote
      setLocalVoteStatus((prev) =>
        prev ? { ...prev, hasUpvoted: false } : null
      );
      setLocalNetVotes((prev) => prev - 1);
    } else {
      // Add upvote (and remove downvote if exists)
      setLocalVoteStatus((prev) => ({ hasUpvoted: true, hasDownvoted: false }));
      setLocalNetVotes((prev) => prev + 1 + (wasDownvoted ? 1 : 0));
    }

    try {
      const response = await fetch("/api/forum/post-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId,
          type: wasUpvoted ? "remove-upvote" : "upvote",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();
      // Update with actual server response if needed
      setLocalNetVotes(result.netVotes);
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert optimistic update on error
      setLocalVoteStatus(userVoteStatus);
      setLocalNetVotes(netVotes);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (!userId || isVoting) return;

    setIsVoting(true);

    // Optimistic update
    const wasUpvoted = localVoteStatus?.hasUpvoted;
    const wasDownvoted = localVoteStatus?.hasDownvoted;

    if (wasDownvoted) {
      // Remove downvote
      setLocalVoteStatus((prev) =>
        prev ? { ...prev, hasDownvoted: false } : null
      );
      setLocalNetVotes((prev) => prev + 1);
    } else {
      // Add downvote (and remove upvote if exists)
      setLocalVoteStatus((prev) => ({ hasUpvoted: false, hasDownvoted: true }));
      setLocalNetVotes((prev) => prev - 1 - (wasUpvoted ? 1 : 0));
    }

    try {
      const response = await fetch("/api/forum/post-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId,
          type: wasDownvoted ? "remove-downvote" : "downvote",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();
      // Update with actual server response if needed
      setLocalNetVotes(result.netVotes);
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert optimistic update on error
      setLocalVoteStatus(userVoteStatus);
      setLocalNetVotes(netVotes);
    } finally {
      setIsVoting(false);
    }
  };

  const hasUpvoted = localVoteStatus?.hasUpvoted || false;
  const hasDownvoted = localVoteStatus?.hasDownvoted || false;

  return (
    <div className="flex flex-col items-center justify-between p-2 bg-secondary/50 rounded-l-lg">
      <button
        onClick={handleUpvote}
        disabled={!userId || isVoting}
        className={`p-1 hover:bg-accent rounded transition-colors disabled:opacity-50 ${
          hasUpvoted
            ? "text-green-600 bg-green-500/10"
            : "text-muted-foreground hover:text-primary"
        }`}
      >
        <ChevronUp size={16} className={hasUpvoted ? "text-green-600" : ""} />
      </button>
      <span className="text-sm font-extrabold py-1">
        {localNetVotes > 0 ? `+${localNetVotes}` : localNetVotes}
      </span>
      <button
        onClick={handleDownvote}
        disabled={!userId || isVoting}
        className={`p-1 hover:bg-accent rounded transition-colors disabled:opacity-50 ${
          hasDownvoted
            ? "text-red-600 bg-red-500/10"
            : "text-muted-foreground hover:text-primary"
        }`}
      >
        <ChevronDown size={16} className={hasDownvoted ? "text-red-600" : ""} />
      </button>
    </div>
  );
};

export default ForumLandingPostVoteButtons;
