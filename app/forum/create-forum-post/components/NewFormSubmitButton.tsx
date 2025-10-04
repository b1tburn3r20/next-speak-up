// Updated NewFormSubmitButton component
"use client";
import { useNewForumPostStore } from "../useNewForumPostStore";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const NewFormSubmitButton = () => {
  const router = useRouter();

  const type = useNewForumPostStore((f) => f.type);
  const title = useNewForumPostStore((f) => f.title);
  const body = useNewForumPostStore((f) => f.body);
  const submitting = useNewForumPostStore((f) => f.submitting);
  const resetStore = useNewForumPostStore((f) => f.resetStore);
  const setSubmitting = useNewForumPostStore((f) => f.setSubmitting);

  const getValidationErrors = () => {
    const errors = [];

    if (!type) {
      errors.push("Type is required");
    }

    if (!title || title.length <= 10) {
      errors.push("Title must be more than 10 characters");
    }

    const minBodyLength = type === "Bill Suggestion" ? 200 : 20;
    if (!body || body.length < minBodyLength) {
      errors.push(`Body must be at least ${minBodyLength} characters`);
    }

    return errors;
  };

  useEffect(() => {
    resetStore();
  }, []);

  const submitForumPost = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/forum/new-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          body: body,
          type: type,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        // Handle rate limit error specifically
        if (response.status === 429 || responseBody.error?.includes("wait")) {
          toast.error(
            responseBody.error || "You can only post once every 3 hours"
          );
        } else {
          toast.error(responseBody.error || "Something went wrong");
        }
        console.log("something went wrong");
      } else {
        router.push(`/forum/posts/${responseBody.created.id}`);
      }
    } catch (error) {
      toast.error("Something went wrong submitting. Please try again.");
      console.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const errors = getValidationErrors();
  const isReady = errors.length === 0;

  const getButtonText = () => {
    switch (type) {
      case "Bill Suggestion":
        return "Post Bill Suggestion";
      case "Site Suggestion":
        return "Post Site Suggestion";
      case "Site Bug":
        return "Post Site Bug";
      default:
        return "Post";
    }
  };

  if (isReady) {
    return (
      <Button disabled={submitting} onClick={submitForumPost}>
        {submitting ? (
          <div className="flex items-center">
            <span>Submitting </span>
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <p>{getButtonText()}</p>
        )}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="opacity-50 cursor-help">
            Missing Requirements
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center font-medium mb-1">Cannot submit:</div>
          <ul className="text-left">
            {errors.map((error, index) => (
              <li key={index} className="text-xs">
                • {error}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NewFormSubmitButton;
