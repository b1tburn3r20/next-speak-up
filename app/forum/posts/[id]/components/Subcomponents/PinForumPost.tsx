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
import { Pin, PinOff, Loader2 } from "lucide-react";
import { useState } from "react";

interface PinForumPostProps {
  userId?: string;
  userRole?: string;
  postId: number;
}

const PinForumPost = ({ userId, userRole, postId }: PinForumPostProps) => {
  const isPostPinned = useForumPostDetailsStore((f) => f.isPostPinned);
  const setIsPostPinned = useForumPostDetailsStore((f) => f.setIsPostPinned);
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);

  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin privileges
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  const updatePostPinStatus = async () => {
    if (!userId) {
      setIsLoginDialogOpen(true);
      return;
    }

    if (!isAdmin) {
      console.error("Unauthorized: Admin privileges required");
      return;
    }

    if (!postId) {
      console.error("Post ID is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/forum/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: postId,
          pinStatus: !isPostPinned,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update pin status");
      }

      const data = await response.json();

      if (data.success) {
        setIsPostPinned(!isPostPinned);
      }
    } catch (error) {
      console.error("Error updating pin status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTooltipText = () => {
    if (isLoading) return "Loading...";
    if (!userId) return "Sign in required";
    if (!isAdmin) return "Admin privileges required";
    return isPostPinned ? "Click to unpin" : "Click to pin";
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="animate-spin" />;
    return isPostPinned ? <PinOff /> : <Pin />;
  };
  console.log(userRole);
  // Show as non-interactive icon for non-admin users
  if (!isAdmin) {
    return (
      <div
        className={`h-10 w-10 shrink-0 p-1 flex items-center justify-center text-muted-foreground ${
          isPostPinned && "text-primary"
        }`}
      >
        {isPostPinned ? <Pin /> : null}
      </div>
    );
  }

  // Interactive button for admin users
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={updatePostPinStatus}
            disabled={isLoading}
            className={`h-10 w-10 shrink-0 p-1 text-muted-foreground ${
              isPostPinned && "text-primary"
            } ${!isLoading && "cursor-pointer"}`}
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

export default PinForumPost;
