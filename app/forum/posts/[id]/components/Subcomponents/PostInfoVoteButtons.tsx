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
  isUserAuthor?: boolean; // Add this prop
}

const PostInfoVoteButtons = ({
  postId,
  userId,
  netVotes,
  userVoteStatus,
  isUserAuthor = false, // Default to false
}: PostInfoVoteButtonsProps) => {
  // Local state to handle optimistic updates
  const [localVoteStatus, setLocalVoteStatus] = useState(userVoteStatus);
  const [localNetVotes, setLocalNetVotes] = useState(netVotes);
  const [isVoting, setIsVoting] = useState(false);

  const handleUpvote = async () => {
    if (!userId || isVoting || isUserAuthor) return; // Prevent voting if user is author

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
    if (!userId || isVoting || isUserAuthor) return; // Prevent voting if user is author

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

  // Show upvoted state when user is author (visual indication)
  const showUpvoted = isUserAuthor || hasUpvoted;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between p-2 sm:p-3 bg-secondary/50 rounded-lg min-h-[100px] sm:min-h-[110px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleUpvote}
              disabled={!userId || isVoting || isUserAuthor}
              className={`p-1.5 sm:p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50 touch-manipulation ${
                showUpvoted
                  ? "text-green-600 bg-green-500/10"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <ChevronUp
                size={18}
                className={`sm:w-5 sm:h-5 ${
                  showUpvoted ? "text-green-600" : ""
                }`}
              />
            </button>
          </TooltipTrigger>
          {isUserAuthor && (
            <TooltipContent>
              <p>You cannot vote on your own post</p>
            </TooltipContent>
          )}
        </Tooltip>

        <span className="text-sm sm:text-base font-extrabold py-1.5 px-1 text-center min-w-[1.5rem]">
          {localNetVotes > 0 ? `+${localNetVotes}` : localNetVotes}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDownvote}
              disabled={!userId || isVoting || isUserAuthor}
              className={`p-1.5 sm:p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50  touch-manipulation ${
                hasDownvoted && !isUserAuthor
                  ? "text-red-600 bg-red-500/10"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <ChevronDown
                size={18}
                className={`sm:w-5 sm:h-5 ${
                  hasDownvoted && !isUserAuthor ? "text-red-600" : ""
                }`}
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
