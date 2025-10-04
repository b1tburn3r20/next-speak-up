"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Minus,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import ForumCommentVoteButtons from "./ForumCommentVoteButtons";
import { toast } from "sonner";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
import Link from "next/link";
import { useLoginStore } from "@/app/navbar/useLoginStore";
import { useDialogStore } from "@/app/stores/useDialogStore";

// Helper function to format time like Reddit
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label}`;
    }
  }
  return "now";
};

// Main PostComment Component
interface PostCommentProps {
  comment: any;
  allComments: any[];
  userId: string;
  depth?: number;
  onReply?: (commentId: number) => void;
  isReplying?: boolean;
  replyingToId?: number | null;
  replyForm?: React.ReactNode;
}

const PostComment = ({
  comment,
  allComments,
  userId,
  depth = 0,
  onReply,
  isReplying = false,
  replyingToId,
  replyForm,
}: PostCommentProps) => {
  // Each comment manages its own deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get store functions
  const postComments = useForumPostDetailsStore((f) => f.postComments);
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  const isMakingAPICall = useForumPostDetailsStore((f) => f.isMakingAPICall);
  const setIsMakingAPICall = useForumPostDetailsStore(
    (f) => f.setIsMakingAPICall
  );
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);
  const setIsUsernameSelectDialogOpen = useDialogStore(
    (state) => state.setIsUsernameSelectDialogOpen
  );
  const userName = useForumPostDetailsStore((f) => f.userName);
  const setUserName = useForumPostDetailsStore((f) => f.setUserName);
  // Get post state to check if interactions should be disabled
  const isPostDeleted = useForumPostDetailsStore((f) => f.isPostDeleted);
  const isPostLocked = useForumPostDetailsStore((f) => f.isPostLocked);

  // Find direct replies to this comment
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const hasReplies = replies.length > 0;
  const isUserAuthor = userId ? comment.authorId === userId : false;
  const isDeleted = comment.isDeleted; // Check if comment is soft deleted

  // Calculate indentation based on depth (max out at certain depth)
  const maxDepth = 8;
  const currentDepth = Math.min(depth, maxDepth);

  // Get vote counts from comment._count
  const upvoteCount = comment._count?.upvotes || 0;
  const downvoteCount = comment._count?.downvotes || 0;

  // Check if interactions should be disabled
  const isInteractionDisabled =
    isPostDeleted || isPostLocked || isMakingAPICall;

  // Calculate total replies count (including nested)
  const getTotalRepliesCount = (commentId: number): number => {
    const directReplies = allComments.filter((c) => c.parentId === commentId);
    return directReplies.reduce((total, reply) => {
      return total + 1 + getTotalRepliesCount(reply.id);
    }, 0);
  };

  const totalRepliesCount = getTotalRepliesCount(comment.id);

  // Display data based on deletion status
  const displayUsername = isDeleted
    ? "[deleted]"
    : comment.author.username || comment.author.name;
  const displayName = isDeleted ? "[deleted]" : comment.author.name;

  // Handle comment deletion - now respects global API state and post status
  const handleDeleteComment = async () => {
    // Check if interactions are disabled
    if (isInteractionDisabled) {
      if (isPostDeleted) {
        toast.warning("Cannot delete comments on a deleted post.");
      } else if (isPostLocked) {
        toast.warning("Cannot delete comments on a locked post.");
      } else {
        toast.warning("Another operation is in progress. Please try again.");
      }
      return;
    }

    try {
      setIsMakingAPICall(true);
      const response = await fetch("/api/forum/comments/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId: comment.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment");
      }

      // Update the comments in the store to reflect the soft deletion
      const updatedComments = postComments.map((c) =>
        c.id === comment.id ? { ...c, isDeleted: true, body: "[deleted]" } : c
      );
      setPostComments(updatedComments);
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error.message || "Failed to delete comment");
    } finally {
      setIsMakingAPICall(false);
    }
  };
  const handleReplyClick = () => {
    if (!userId) {
      setIsLoginDialogOpen(true);
      return;
    }

    if (!userName) {
      setIsUsernameSelectDialogOpen(true);
      return;
    }

    // Only initiate reply state if user has both login and username
    onReply?.(comment.id);
  };

  // Much smaller spacing - reduced from 20px to 8px per level
  const indentPerLevel = 8;
  const lineOffset = 4; // Reduced from 12px to 4px

  return (
    <div className="relative">
      {/* Collapse line indicator - much thinner and closer to left */}
      {currentDepth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-border hover:bg-foreground/20 cursor-pointer transition-colors"
          onClick={() => hasReplies && setIsCollapsed(!isCollapsed)}
          style={{
            marginLeft: `${lineOffset + (currentDepth - 1) * indentPerLevel}px`,
          }}
        />
      )}

      {/* Main Comment Container */}
      <div
        className="relative"
        style={{
          marginLeft:
            currentDepth > 0
              ? `${lineOffset * 2 + (currentDepth - 1) * indentPerLevel}px`
              : "0",
        }}
      >
        {/* Comment Header and Content */}
        <div className="group">
          {/* Main Comment Row */}
          <div
            className={`py-1 px-2 rounded hover:bg-muted/30 transition-colors ${
              isDeleted ? "opacity-70" : ""
            } ${isInteractionDisabled ? "opacity-60" : ""}`}
          >
            {/* Header with avatar, username, and metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {/* Collapse Toggle - positioned before username */}
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-muted shrink-0"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <Plus className="h-2.5 w-2.5" />
                  ) : (
                    <Minus className="h-2.5 w-2.5" />
                  )}
                </Button>
              )}

              {/* Avatar - only show if not deleted */}
              {!isDeleted && (
                <Link
                  href={`/community/users/${comment.author.id}`}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-6 h-6 shrink-0 rounded-lg">
                    <AvatarImage
                      src={comment.author.image}
                      alt={comment.author.name}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="text-xs">
                      {comment.author.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}

              <div></div>

              {/* Username - make it a link if not deleted */}
              {isDeleted ? (
                <span className="font-medium text-muted-foreground">
                  {displayUsername}
                </span>
              ) : (
                <Link
                  href={`/community/users/${comment.author.id}`}
                  className="font-medium text-foreground hover:underline hover:opacity-80 transition-opacity"
                >
                  {displayUsername}
                </Link>
              )}

              <span>•</span>
              <span>{formatTimeAgo(new Date(comment.createdAt))}</span>

              {/* Edited indicator - don't show for deleted comments */}
              {!isDeleted && comment.isEdited && (
                <span className="italic">(edited)</span>
              )}
            </div>

            {/* Comment Body */}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm ${isCollapsed ? "line-clamp-2" : ""} ${
                  isDeleted ? "italic text-muted-foreground" : ""
                }`}
                style={{
                  marginLeft: hasReplies ? "24px" : "20px", // Align with username
                }}
              >
                <div className="whitespace-pre-wrap break-words">
                  {comment.body}
                </div>
              </div>

              {/* Actions - Only show when not collapsed */}
              {!isCollapsed && (
                <div
                  className="flex items-center gap-1 mt-2"
                  style={{
                    marginLeft: hasReplies ? "24px" : "20px", // Align with body
                  }}
                >
                  {/* Vote Buttons - disable for deleted comments or when post is locked/deleted */}
                  <ForumCommentVoteButtons
                    commentId={comment.id}
                    upvotes={upvoteCount}
                    downvotes={downvoteCount}
                    userVoteStatus={comment.userVoteStatus}
                    userId={userId}
                    isUserAuthor={isUserAuthor}
                    disabled={isDeleted || isInteractionDisabled}
                  />

                  {/* Reply Button - disable for deleted comments or when post is locked/deleted */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${
                      isReplying ? "bg-muted" : ""
                    }`}
                    onClick={handleReplyClick} // Changed from onReply?.(comment.id)
                    disabled={isReplying || isDeleted || isInteractionDisabled}
                    title={
                      isPostDeleted
                        ? "Cannot reply to comments on a deleted post"
                        : isPostLocked
                        ? "Cannot reply to comments on a locked post"
                        : undefined
                    }
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{isReplying ? "Replying..." : "Reply"}</span>
                  </Button>
                  {/* Delete Button - only show for comment author and not already deleted */}
                  {!isDeleted && isUserAuthor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDeleteComment}
                      disabled={isInteractionDisabled}
                      title={
                        isPostDeleted
                          ? "Cannot delete comments on a deleted post"
                          : isPostLocked
                          ? "Cannot delete comments on a locked post"
                          : undefined
                      }
                    >
                      {isMakingAPICall ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Collapsed indicator */}
              {isCollapsed && hasReplies && (
                <div
                  className="mt-1 text-xs text-muted-foreground"
                  style={{
                    marginLeft: hasReplies ? "24px" : "20px",
                  }}
                >
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => setIsCollapsed(false)}
                  >
                    {totalRepliesCount} more repl
                    {totalRepliesCount === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reply Form for this comment - don't show for deleted comments or when post is locked/deleted */}
          {!isDeleted &&
            !isInteractionDisabled &&
            replyingToId === comment.id &&
            replyForm &&
            !isCollapsed && (
              <div
                className="mt-2"
                style={{
                  marginLeft: hasReplies ? "24px" : "20px", // Align with body
                }}
              >
                {replyForm}
              </div>
            )}
        </div>

        {/* Nested Replies */}
        {hasReplies && !isCollapsed && (
          <div className="mt-1">
            {replies.map((reply) => (
              <PostComment
                key={reply.id}
                comment={reply}
                allComments={allComments}
                userId={userId}
                depth={depth + 1}
                onReply={onReply}
                isReplying={replyingToId === reply.id}
                replyingToId={replyingToId}
                replyForm={replyForm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComment;
