"use client";

import { FullForumPost } from "@/lib/types/forum-types";
import PostInfoVoteButtons from "./PostInfoVoteButtons";
import PostBookmark from "./PostBookmark";
import ForumPostViews from "./ForumPostViews";
import { useEffect } from "react";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";

interface PostClientSideTopComponentsProps {
  post: FullForumPost;
  userId: string | null;
}

const PostClientSideTopComponents = ({
  post,
  userId,
}: PostClientSideTopComponentsProps) => {
  const netVotes = post._count.upvotes - post._count.downvotes;
  const isUserAuthor = userId ? post.authorId === userId : false;
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  useEffect(() => {
    setPostComments(post.comments);
  }, []);
  return (
    <div className="flex items-center gap-8">
      <PostInfoVoteButtons
        postId={post.id}
        userVoteStatus={post.userVoteStatus}
        userId={userId}
        netVotes={netVotes}
        isUserAuthor={isUserAuthor}
      />
      <PostBookmark userId={userId} postId={post.id} />
      <ForumPostViews postViews={post.views} />
    </div>
  );
};

export default PostClientSideTopComponents;
