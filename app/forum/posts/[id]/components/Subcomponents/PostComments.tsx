"use client";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePostComment from "./CreatePostComment";
import PostComment from "./PostComment";
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
  // Filter out only root-level comments (parentId === null)
  const postComments = useForumPostDetailsStore((f) => f.postComments);

  const rootComments = postComments.filter(
    (comment) => comment.parentId === null
  );
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
