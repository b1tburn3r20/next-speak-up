"use client";

import { FullForumPost } from "@/lib/types/forum-types";
import PostInfoVoteButtons from "./PostInfoVoteButtons";
import PostBookmark from "./PostBookmark";
import ForumPostViews from "./ForumPostViews";
import { useEffect } from "react";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
import PinForumPost from "./PinForumPost";
import LockForumPost from "./LockForumPost";

interface PostClientSideTopComponentsProps {
  post: FullForumPost;
  userId: string | null;
  userRole: string | null;
  userName: string | null;
}

const PostClientSideTopComponents = ({
  post,
  userId,
  userRole,
  userName,
}: PostClientSideTopComponentsProps) => {
  const netVotes = post._count.upvotes - post._count.downvotes;
  const isUserAuthor = userId ? post.authorId === userId : false;
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  const setIsPostPinned = useForumPostDetailsStore((f) => f.setIsPostPinned);
  const setIsPostLocked = useForumPostDetailsStore((f) => f.setIsPostLocked);
  const setUserName = useForumPostDetailsStore((f) => f.setUserName);
  useEffect(() => {
    setPostComments(post.comments);
    setIsPostPinned(post.isPinned);
    setIsPostLocked(post.isLocked);
    setUserName(userName);
  }, [userName, post.isLocked, post.isPinned]);
  const isDeleted = post.title === "[deleted]" && post.body === "[deleted]";

  return (
    <div className="w-full">
      {/* Horizontal layout with proper spacing and alignment */}
      <div className="flex items-center justify-start gap-4 sm:gap-6 lg:gap-8">
        {/* Vote buttons - main action */}
        <PostInfoVoteButtons
          postId={post.id}
          userVoteStatus={post.userVoteStatus}
          userId={userId}
          netVotes={netVotes}
          isUserAuthor={isUserAuthor}
          isDeleted={isDeleted} // Pass the deleted status
          userRole={userRole}
        />

        {/* Secondary actions with consistent spacing */}
        <div className="flex items-center flex-wrap gap-4 justify-between">
          <PostBookmark userId={userId} postId={post.id} />
          <ForumPostViews postViews={post.views} />
          <PinForumPost userId={userId} postId={post.id} userRole={userRole} />
          <LockForumPost userId={userId} postId={post.id} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};

export default PostClientSideTopComponents;
