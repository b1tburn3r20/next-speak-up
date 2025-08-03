"use client";

import dynamic from "next/dynamic";
import { useNewForumPostStore } from "../useNewForumPostStore";

// Import CSS files
import "@uiw/react-markdown-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { Label } from "@/components/ui/label";

// Dynamically import the MarkdownEditor to avoid SSR issues
const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false }
);

const NewForumBody = () => {
  const body = useNewForumPostStore((f) => f.body);
  const setBody = useNewForumPostStore((f) => f.setBody);
  const type = useNewForumPostStore((f) => f.type);
  const getLabel = () => {
    switch (type) {
      case "Bill Suggestion":
        return "Describe The Purpose";
      case "Site Suggestion":
        return "Describe Your Suggestion";
      case "Site Bug":
        return "Describe The Issue";
      default:
        return "Post Body";
    }
  };
  return (
    <div className="w-full">
      <div>
        <Label>{getLabel()}</Label>
        <MarkdownEditor
          value={body || ""}
          height="400px"
          onChange={(value) => setBody(value)}
          toolbars={[
            "bold",
            "italic",
            "header",
            "strike",
            "underline",
            "quote",
            "olist",
            "ulist",
            "todo",
            "link",
            "fullscreen",
          ]}
          visibleEditor
          visible
          enablePreview={true}
          previewWidth="50%"
        />
      </div>
    </div>
  );
};

export default NewForumBody;
