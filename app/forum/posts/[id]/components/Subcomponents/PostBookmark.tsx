"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
import { useLoginStore } from "@/app/navbar/useLoginStore";
import { BookMarked, BookmarkCheck, Loader2 } from "lucide-react";
import { useState } from "react";

interface PostBookmarkProps {
  postId: number;
  userId?: string | null;
}

const PostBookmark = ({ postId, userId }: PostBookmarkProps) => {
  const isPostBookmarked = useForumPostDetailsStore((f) => f.isPostBookmarked);
  const setIsPostBookmarked = useForumPostDetailsStore(
    (f) => f.setIsPostBookmarked
  );
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);

  const [isLoading, setIsLoading] = useState(false);

  const updatePostBookmarkStatus = async () => {
    if (!userId) {
      console.log("fo");

      setIsLoginDialogOpen(true);
      return;
    }

    if (!postId) {
      console.error("Post ID is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/forum/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: postId,
          bookmarkStatus: !isPostBookmarked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update bookmark");
      }

      const data = await response.json();

      if (data.success) {
        setIsPostBookmarked(!isPostBookmarked);
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTooltipText = () => {
    if (isLoading) return "Loading...";
    if (!userId) return "Sign in to bookmark";
    return isPostBookmarked ? "Click to unbookmark" : "Click to bookmark";
  };

  const getIcon = () => {
    return isPostBookmarked ? <BookmarkCheck /> : <BookMarked />;
  };

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={updatePostBookmarkStatus}
            disabled={isLoading}
            className={`h-10 w-10 shrink-0 p-1 text-muted-foreground ${
              isPostBookmarked && "text-primary"
            } ${!isLoading && "cursor-pointer"}`}
            asChild
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PostBookmark;
