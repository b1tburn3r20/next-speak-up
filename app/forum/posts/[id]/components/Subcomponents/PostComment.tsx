"use client";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ForumCommentVoteButtons from "./ForumCommentVoteButtons";

// Reply Button Component
interface ReplyButtonProps {
  onReply?: () => void;
  disabled?: boolean;
}

const ReplyButton = ({ onReply, disabled = false }: ReplyButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 gap-1"
      onClick={onReply}
      disabled={disabled}
    >
      <MessageSquare className="h-3 w-3" />
      <span>Reply</span>
    </Button>
  );
};

// Main PostComment Component
interface PostCommentProps {
  comment: any;
  allComments: any[];
  userId: string;
  depth?: number;
}

const PostComment = ({
  comment,
  allComments,
  userId,
  depth = 0,
}: PostCommentProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find direct replies to this comment
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const hasReplies = replies.length > 0;
  const isUserAuthor = userId ? comment.authorId === userId : false;

  // Calculate indentation based on depth (max out at certain depth)
  const maxDepth = 6;
  const currentDepth = Math.min(depth, maxDepth);
  const indentationClass =
    currentDepth > 0
      ? `ml-${currentDepth * 4} border-l-2 border-muted pl-4`
      : "";

  // Get vote counts from comment._count
  const upvoteCount = comment._count?.upvotes || 0;
  const downvoteCount = comment._count?.downvotes || 0;

  return (
    <div className={`flex flex-col ${indentationClass}`}>
      {/* Main Comment */}
      <div className="flex gap-4 p-3 items-center rounded-lg hover:bg-muted/50 transition-colors">
        {/* Avatar */}
        <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
          <AvatarImage
            src={comment.author.image}
            alt={comment.author.name}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="rounded-lg bg-primary/10">
            {comment.author.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-muted-foreground mb-1 flex-wrap">
            <span className="text-xs text-muted-foreground">
              u/{comment.author.username}
            </span>
            <span>•</span>

            {comment.author.role && (
              <p className="text-xs">{comment.author.role.name}</p>
            )}
            <span>•</span>

            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground italic">
                (edited)
              </span>
            )}
          </div>

          {/* Comment Body */}
          {!isCollapsed && (
            <div className="text-sm mb-2 whitespace-pre-wrap">
              {comment.body}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 text-xs">
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
            {/* <ReplyButton /> */}

            {/* Collapse/Expand Button */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span>
                      {replies.length} repl{replies.length === 1 ? "y" : "ies"}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    <span>Collapse</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-2">
          {replies.map((reply) => (
            <PostComment
              key={reply.id}
              comment={reply}
              allComments={allComments}
              userId={userId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Collapsed State Indicator */}
      {isCollapsed && hasReplies && (
        <div className="ml-11 text-xs text-muted-foreground italic">
          {replies.length} repl{replies.length === 1 ? "y" : "ies"} hidden
        </div>
      )}
    </div>
  );
};

export default PostComment;
