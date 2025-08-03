"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
import { useLoginStore } from "@/app/app/navbar/useLoginStore";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";

interface LockForumPostProps {
  userId?: string;
  userRole?: string;
  postId: number;
}

const LockForumPost = ({ userId, userRole, postId }: LockForumPostProps) => {
  const isPostLocked = useForumPostDetailsStore((f) => f.isPostLocked);
  const setIsPostLocked = useForumPostDetailsStore((f) => f.setIsPostLocked);
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);

  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin privileges
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  const updatePostLockStatus = async () => {
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
      const response = await fetch("/api/forum/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: postId,
          lockStatus: !isPostLocked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update pin status");
      }

      const data = await response.json();

      if (data.success) {
        setIsPostLocked(!isPostLocked);
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
    return isPostLocked ? "Click to unpin" : "Click to pin";
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="animate-spin" />;
    return isPostLocked ? (
      <Lock className="text-amber-500 h-8 w-8" />
    ) : (
      <Lock className="text-muted-foreground  h-8 w-8" />
    );
  };
  console.log(userRole);
  // Show as non-interactive icon for non-admin users
  if (!isAdmin) {
    return (
      <div
        className={`h-10 w-10 shrink-0 p-1 flex items-center justify-center text-muted-foreground ${
          isPostLocked && "text-primary"
        }`}
      >
        {isPostLocked ? <Lock className=" h-8 w-8" /> : null}
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
            onClick={updatePostLockStatus}
            asChild
            disabled={isLoading}
            className={`h-10 w-10 shrink-0 p-1 text-muted-foreground ${
              isPostLocked && "text-primary"
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

export default LockForumPost;
