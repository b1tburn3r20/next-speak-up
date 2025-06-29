import { FullLandingForumPost } from "@/lib/types/forum-types";
import { MessageCircle, Pin, Lock } from "lucide-react";
import ForumLandingPostVoteButtons from "./ForumLandingPostVoteButtons";
import Link from "next/link";

interface ForumLandingPostProps {
  post: FullLandingForumPost;
  userId?: string;
}

const ForumLandingPost = ({ post, userId }: ForumLandingPostProps) => {
  const netVotes = post._count.upvotes - post._count.downvotes;
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <div className="border rounded-lg">
      <div className="flex">
        {/* Vote Section - Client Component */}
        <ForumLandingPostVoteButtons
          postId={post.id}
          userId={userId}
          netVotes={netVotes}
        />

        {/* Content Section - Server Component */}
        <div className="flex-1 p-3">
          {/* Header with badges */}
          <div className="flex items-center gap-2 mb-2">
            {post.isPinned && <Pin size={14} className="text-primary" />}
            {post.isLocked && <Lock size={14} className="text-destructive" />}
            <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
              {post.type}
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/forum/posts/${post.id}`}
            className="font-semibold mb-2 hover:text-primary cursor-pointer transition-colors"
          >
            {post.title}
          </Link>

          {/* Post metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">u/{post.author.username}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>

            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span>{post._count.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
};

export default ForumLandingPost;
