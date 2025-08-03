import { Card } from "@/components/ui/card";
import { ForumPost } from "@prisma/client";
import {
  ArrowRight,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Pin,
} from "lucide-react";
import Link from "next/link";

interface ForumPostViewCardProps {
  post: ForumPost & {
    author: { name: string | null; image: string | null };
    _count: {
      comments: number;
      upvotes: number;
      downvotes: number;
      bookmarks: number;
    };
    isBookmarked?: boolean;
  };
}

// Helper function to get post type styling
const getPostTypeStyles = (type: string) => {
  switch (type) {
    case "feature_request":
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        label: "Feature Request",
      };
    case "bill_discussion":
      return {
        color: "text-green-600",
        bgColor: "bg-green-50",
        label: "Bill Discussion",
      };
    case "bug_report":
      return {
        color: "text-red-600",
        bgColor: "bg-red-50",
        label: "Bug Report",
      };
    case "general":
      return {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        label: "General",
      };
    default:
      return {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        label: "General",
      };
  }
};

// Helper function to format date
const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// Desktop Component
const DesktopForumPostCard = ({ post }: ForumPostViewCardProps) => {
  const typeStyles = getPostTypeStyles(post.type);

  const getIcon = () => {
    if (post.isBookmarked) {
      return (
        <div className="absolute bottom-4 right-4 z-5 pointer-events-none">
          <Bookmark className="w-24 h-24 text-blue-400 fill-blue-400" />
        </div>
      );
    }

    if (post.isPinned) {
      return (
        <div className="absolute bottom-4 right-4 z-5 pointer-events-none">
          <Pin className="w-24 h-24 text-yellow-400" />
        </div>
      );
    }
  };

  return (
    <Link href={`/forum/posts/${post.id}`} className="block">
      <Card className="h-[300px] aspect-square select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50 rounded-3xl">
        {/* Gradient overlay */}
        <div className="absolute top-1/3 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/80 to-background z-10 pointer-events-none" />
        {getIcon()}

        <div className="p-8 h-full flex flex-col relative">
          {/* Title */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground line-clamp-2">
              {post.title}
            </h3>
          </div>

          {/* Author and date */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">
              by {post.author.name || "Anonymous"} •{" "}
              {formatDate(post.createdAt)}
            </div>
          </div>

          {/* Body preview */}
          <div className="flex-1 relative">
            <p className="text-sm text-muted-foreground line-clamp-4">
              {post.body.replace(/<[^>]*>/g, "")} {/* Strip HTML tags */}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.views}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {post._count.comments}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {post._count.upvotes}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" />
              {post._count.downvotes}
            </div>
          </div>

          {/* Bottom action area */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
            <div className="flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-3xl p-4 transition-all duration-500 ease-out">
              <span className="text-lg font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out">
                <span className="block group-hover:hidden">View</span>
                <span className="hidden group-hover:block">
                  {typeStyles.label}
                </span>
              </span>

              <ArrowRight className="w-5 h-5 text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Mobile Component
const MobileForumPostCard = ({ post }: ForumPostViewCardProps) => {
  const typeStyles = getPostTypeStyles(post.type);

  const getIcon = () => {
    if (post.isBookmarked) {
      return (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Bookmark className="w-6 h-6 text-blue-400 fill-blue-400" />
        </div>
      );
    }

    if (post.isPinned) {
      return (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Pin className="w-6 h-6 text-yellow-400" />
        </div>
      );
    }
  };

  return (
    <Link href={`/forum/posts/${post.id}`} className="block">
      <Card className="h-[200px] w-[280px] select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-border/50 rounded-2xl">
        {/* Mobile gradient overlay */}
        <div className="absolute top-2/3 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/50 to-background z-10 pointer-events-none" />
        {getIcon()}

        <div className="p-4 h-full flex flex-col relative">
          {/* Title */}
          <div className="mb-3">
            <h3 className="text-sm font-bold text-foreground line-clamp-2">
              {post.title}
            </h3>
          </div>

          {/* Author and date */}
          <div className="mb-2">
            <div className="text-xs text-muted-foreground">
              by {post.author.name || "Anonymous"} •{" "}
              {formatDate(post.createdAt)}
            </div>
          </div>

          {/* Body preview */}
          <div className="flex-1 relative z-5">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {post.body.replace(/<[^>]*>/g, "")}
            </p>
          </div>

          {/* Stats - mobile optimized */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.views}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {post._count.comments}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {post._count.upvotes}
            </div>
          </div>

          {/* Bottom action area */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
            <div className="flex items-center justify-between border-2 border-transparent group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-xl p-3 transition-all duration-500 ease-out">
              <span className="text-sm font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out">
                <span className="block group-hover:hidden">View</span>
                <span className="hidden group-hover:block text-xs">
                  {typeStyles.label}
                </span>
              </span>

              <ArrowRight className="w-4 h-4 text-stone-500/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Main Server Component
const ForumPostViewCard = ({ post }: ForumPostViewCardProps) => {
  return (
    <>
      {/* Hidden on small screens, shown on md and above */}
      <div className="hidden md:block">
        <DesktopForumPostCard post={post} />
      </div>
      {/* Shown on small screens, hidden on md and above */}
      <div className="block md:hidden">
        <MobileForumPostCard post={post} />
      </div>
    </>
  );
};

export default ForumPostViewCard;
