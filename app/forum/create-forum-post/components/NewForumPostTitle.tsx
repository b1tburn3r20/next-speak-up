"use client";

import { Input } from "@/components/ui/input";
import { useNewForumPostStore } from "../useNewForumPostStore";
import { Label } from "@/components/ui/label";

const NewForumPostTitle = () => {
  const title = useNewForumPostStore((f) => f.title);
  const setTitle = useNewForumPostStore((f) => f.setTitle);
  const type = useNewForumPostStore((f) => f.type);

  const getLabel = () => {
    switch (type) {
      case "Bill Suggestion":
        return "Bill Name";
      case "Site Suggestion":
        return "Suggestion Title";
      case "Site Bug":
        return "Site Bug Title";
      default:
        return "Post Title";
    }
  };
  const getPlaceholder = () => {
    switch (type) {
      case "Bill Suggestion":
        return "enter suggested bill name...";
      case "Site Suggestion":
        return "enter title of suggested feature or change...";
      case "Site Bug":
        return "enter title for post about bug...";
      default:
        return "enter post title...";
    }
  };

  return (
    <div>
      <Label>{getLabel()} </Label>
      <Input
        autoFocus
        placeholder={getPlaceholder()}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </div>
  );
};

export default NewForumPostTitle;
