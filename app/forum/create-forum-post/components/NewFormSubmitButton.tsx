"use client";
import { useNewForumPostStore } from "../useNewForumPostStore";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NewFormSubmitButton = () => {
  const type = useNewForumPostStore((f) => f.type);
  const title = useNewForumPostStore((f) => f.title);
  const body = useNewForumPostStore((f) => f.body);

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

  const submitForumPost = async () => {
    const response = await fetch("/api/forum/new-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        body: body,
        type: type,
      }),
    });
    if (!response.ok) {
      console.log("something went wrong");
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
    return <Button onClick={submitForumPost}>{getButtonText()}</Button>;
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
