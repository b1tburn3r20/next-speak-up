"use client";

import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";

interface UserVoteStatus {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
}

interface PostInfoVoteButtonsProps {
  postId: number;
  userId?: string;
  authorId?: string; // Add authorId to check if user is the author
  netVotes: number;
  userVoteStatus?: UserVoteStatus | null;
  isUserAuthor?: boolean;
  isDeleted?: boolean; // Add prop to check if post is deleted
}

const PostInfoVoteButtons = ({
  postId,
  userId,
  authorId,
  netVotes,
  userVoteStatus,
  isUserAuthor = false,
  isDeleted = false, // Default to false
}: PostInfoVoteButtonsProps) => {
  // Local state to handle optimistic updates
  const [localVoteStatus, setLocalVoteStatus] = useState(userVoteStatus);
  const [localNetVotes, setLocalNetVotes] = useState(netVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get post status from store
  const isPostDeleted = useForumPostDetailsStore((f) => f.isPostDeleted);
  const isPostLocked = useForumPostDetailsStore((f) => f.isPostLocked);
  const setIsPostDeleted = useForumPostDetailsStore((f) => f.setIsPostDeleted);

  // Check if current user can delete this post (and post is not already deleted)
  const canDelete =
    userId &&
    (userId === authorId || isUserAuthor) &&
    !isDeleted &&
    !isPostDeleted;

  // Check if voting should be disabled
  const isVotingDisabled =
    !userId || isVoting || isUserAuthor || isPostDeleted || isPostLocked;

  const handleUpvote = async () => {
    if (isVotingDisabled) return;

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
    if (isVotingDisabled) return;

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

  const handleDelete = async () => {
    if (!userId || !canDelete || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/forum/posts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
      }

      const result = await response.json();
      console.log("Post deleted successfully:", result.message);
      if (response.ok) {
        // Update store to reflect deleted state
        setIsPostDeleted(true);
        // Optionally reload or navigate
        window.location.reload();
      }
      // Close the dialog
      setIsDialogOpen(false);

      // Call the callback to notify parent component
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUpvoted = localVoteStatus?.hasUpvoted || false;
  const hasDownvoted = localVoteStatus?.hasDownvoted || false;

  // Show upvoted state when user is author (visual indication)
  const showUpvoted = isUserAuthor || hasUpvoted;

  // Generate tooltip text for voting buttons
  const getVoteTooltipText = () => {
    if (isUserAuthor) return "You cannot vote on your own post";
    if (isPostDeleted) return "Cannot vote on deleted posts";
    if (isPostLocked) return "Cannot vote on locked posts";
    return undefined;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 sm:gap-3 bg-secondary/30 rounded-lg px-3 py-2 border border-border/50">
        {/* Upvote Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleUpvote}
              disabled={isVotingDisabled}
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
          <TooltipContent>
            <p>{getVoteTooltipText() || "Upvote"}</p>
          </TooltipContent>
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
              disabled={isVotingDisabled}
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
          <TooltipContent>
            <p>{getVoteTooltipText() || "Downvote"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete Button - Only show if user can delete and post is not deleted */}
        {canDelete && (
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isDeleting}
                    className="flex items-center justify-center p-2 rounded-md transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 ml-1"
                  >
                    <Trash2
                      size={18}
                      strokeWidth={2.5}
                      className={isDeleting ? "animate-pulse" : ""}
                    />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete post</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot
                  be undone. The post will be permanently removed from the
                  forum.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PostInfoVoteButtons;
