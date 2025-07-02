"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // or whatever toast library you're using
import { useForumPostDetailsStore } from "../../useForumPostDetailsStore";
const CreatePostComment = ({ postId, userId }) => {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setPostComments = useForumPostDetailsStore((f) => f.setPostComments);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!value.trim()) return;
    if (!userId) {
      toast.error("You must be logged in to comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forum/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: value.trim(),
          postId: postId,
          authorId: userId,
          // parentId is intentionally omitted for root-level comments
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }
      const data = await response.json();
      if (response.ok) {
        setPostComments(data);
      }

      // Clear the input
      setValue("");

      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!userId) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground border border-dashed rounded-lg">
        Please log in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Input
        className="h-12 md:text-md border-primary/70 border-2 pr-12"
        placeholder="Share your thoughts"
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        value={value}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        disabled={!value.trim() || isSubmitting}
        className="absolute right-2 top-[7px] p-1 cursor-pointer"
        variant="ghost"
        size="icon"
      >
        <Send
          className={`text-primary hover:text-primary ${
            isSubmitting ? "animate-pulse" : ""
          }`}
        />
      </Button>
    </form>
  );
};

export default CreatePostComment;
