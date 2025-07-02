"use client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePostComment from "./CreatePostComment";
import PostComment from "./PostComment";
import PostReply from "./PostReply";
import { FullForumPost } from "@/lib/types/forum-types";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";

interface PostCommentsProps {
  post: FullForumPost;
  userId: string;
  isLoading?: boolean;
}

const PostComments = ({
  post,
  userId,
  isLoading = false,
}: PostCommentsProps) => {
  // Track which comment is being replied to (null means no active reply)
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  // Filter out only root-level comments (parentId === null)
  const postComments = useForumPostDetailsStore((f) => f.postComments);

  const rootComments = postComments.filter(
    (comment) => comment.parentId === null
  );

  const handleReply = (commentId: number) => {
    setReplyingToId(commentId);
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
  };

  const handleSubmitReply = async (commentId: number, replyText: string) => {
    try {
      // Submit the reply to your API
      const response = await fetch("/api/forum/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentId: commentId, // This makes it a reply
          postId: post.id,
          body: replyText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit reply");
      }
      const data = await response.json();
      if (response.ok) {
        // console.log(data);
        setPostComments(data);
      }

      // Close the reply form
      setReplyingToId(null);

      // Refresh comments using your store's refresh method
      // You might need to add this method to your store
    } catch (error) {
      console.error("Failed to submit reply:", error);
      throw error;
    }
  };

  // Create the reply form component
  const replyForm = replyingToId ? (
    <PostReply
      commentId={replyingToId}
      onSubmit={(text) => handleSubmitReply(replyingToId, text)}
      onCancel={handleCancelReply}
      replyingTo={
        postComments.find((c) => c.id === replyingToId)?.author?.username ||
        "user"
      }
    />
  ) : null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="w-full h-40" />
        <CreatePostComment postId={post.id} userId={userId} />
      </div>
    );
  }

  return (
    <div className="flex min-h-72 flex-col justify-between gap-4">
      {/* Comments Section Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Comments ({postComments.length})
          </h3>
        </div>

        {/* Comments List */}
        <div className="flex flex-col gap-3">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => (
              <PostComment
                key={comment.id}
                comment={comment}
                allComments={postComments}
                userId={userId}
                onReply={handleReply}
                isReplying={replyingToId === comment.id}
                replyingToId={replyingToId}
                replyForm={replyForm}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>

      <CreatePostComment postId={post.id} userId={userId} />
    </div>
  );
};

export default PostComments;
