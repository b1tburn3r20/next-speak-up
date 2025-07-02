"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserVoteStatus {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
}

interface PostInfoVoteButtonsProps {
  postId: number;
  userId?: string;
  netVotes: number;
  userVoteStatus?: UserVoteStatus | null;
  isUserAuthor?: boolean;
}

const PostInfoVoteButtons = ({
  postId,
  userId,
  netVotes,
  userVoteStatus,
  isUserAuthor = false,
}: PostInfoVoteButtonsProps) => {
  // Local state to handle optimistic updates
  const [localVoteStatus, setLocalVoteStatus] = useState(userVoteStatus);
  const [localNetVotes, setLocalNetVotes] = useState(netVotes);
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

  // Show upvoted state when user is author (visual indication)
  const showUpvoted = isUserAuthor || hasUpvoted;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 sm:gap-3 bg-secondary/30 rounded-lg px-3 py-2 border border-border/50">
        {/* Upvote Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleUpvote}
              disabled={!userId || isVoting || isUserAuthor}
              className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 ${
                showUpvoted
                  ? "text-green-600 bg-green-50 dark:bg-green-950/50 shadow-sm"
                  : "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
              }`}
            >
              <ChevronUp
                size={20}
                className={`${showUpvoted ? "text-green-600" : ""}`}
                strokeWidth={2.5}
              />
            </button>
          </TooltipTrigger>
          {isUserAuthor && (
            <TooltipContent>
              <p>You cannot vote on your own post</p>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Vote Count */}
        <div className="flex items-center justify-center min-w-[3rem] px-2">
          <span
            className={`text-sm sm:text-base font-bold text-center ${
              localNetVotes > 0
                ? "text-green-600"
                : localNetVotes < 0
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            {localNetVotes > 0 ? `+${localNetVotes}` : localNetVotes}
          </span>
        </div>

        {/* Downvote Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDownvote}
              disabled={!userId || isVoting || isUserAuthor}
              className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 ${
                hasDownvoted && !isUserAuthor
                  ? "text-red-600 bg-red-50 dark:bg-red-950/50 shadow-sm"
                  : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              }`}
            >
              <ChevronDown
                size={20}
                className={`${
                  hasDownvoted && !isUserAuthor ? "text-red-600" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>
          </TooltipTrigger>
          {isUserAuthor && (
            <TooltipContent>
              <p>You cannot vote on your own post</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default PostInfoVoteButtons;
