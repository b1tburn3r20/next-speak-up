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
} from "lucide-react";
import { useState } from "react";
import ForumCommentVoteButtons from "./ForumCommentVoteButtons";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find direct replies to this comment
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const hasReplies = replies.length > 0;
  const isUserAuthor = userId ? comment.authorId === userId : false;

  // Calculate indentation based on depth (max out at certain depth)
  const maxDepth = 8;
  const currentDepth = Math.min(depth, maxDepth);

  // Get vote counts from comment._count
  const upvoteCount = comment._count?.upvotes || 0;
  const downvoteCount = comment._count?.downvotes || 0;

  // Calculate total replies count (including nested)
  const getTotalRepliesCount = (commentId: number): number => {
    const directReplies = allComments.filter((c) => c.parentId === commentId);
    return directReplies.reduce((total, reply) => {
      return total + 1 + getTotalRepliesCount(reply.id);
    }, 0);
  };

  const totalRepliesCount = getTotalRepliesCount(comment.id);

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
          <div className="py-1 px-2 rounded hover:bg-muted/30 transition-colors">
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

              {/* Avatar next to username */}
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

              <span className="font-medium text-foreground">
                {comment.author.username}
              </span>
              {comment.author.role && (
                <>
                  <span>•</span>
                  <span className="text-xs">{comment.author.role.name}</span>
                </>
              )}
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {comment.isEdited && <span className="italic">(edited)</span>}
            </div>

            {/* Comment Body */}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm ${isCollapsed ? "line-clamp-2" : ""}`}
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
                  {/* Vote Buttons */}
                  <ForumCommentVoteButtons
                    commentId={comment.id}
                    upvotes={upvoteCount}
                    downvotes={downvoteCount}
                    userVoteStatus={comment.userVoteStatus}
                    userId={userId}
                    isUserAuthor={isUserAuthor}
                  />

                  {/* Reply Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${
                      isReplying ? "bg-muted" : ""
                    }`}
                    onClick={() => onReply?.(comment.id)}
                    disabled={!userId || isReplying}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{isReplying ? "Replying..." : "Reply"}</span>
                  </Button>
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

          {/* Reply Form for this comment */}
          {replyingToId === comment.id && replyForm && !isCollapsed && (
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
