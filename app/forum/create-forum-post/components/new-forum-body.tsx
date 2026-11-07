"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useNewForumPostStore } from "../use-new-forum-post-store";

// Import CSS files
import "@uiw/react-markdown-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the MarkdownEditor to avoid SSR issues
const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-2xl" data-testid="editor-skeleton" /> }
);

const NewForumBody = () => {
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";
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
      <div data-color-mode={colorMode}>
        <Label>{getLabel()}</Label>
        <MarkdownEditor
          value={body || ""}
          theme={colorMode}
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
