import { FullForumPost } from "@/lib/types/forum-types";
import ReactMarkdown from "react-markdown";
import UserReferenceContainer from "./Subcomponents/UserRefranceContainer";

interface ViewPostContentProps {
  post: FullForumPost;
}

const ViewPostContent = ({ post }: ViewPostContentProps) => {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Responsive title */}
      <div className="text-primary text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight break-words">
        {post.title}
      </div>

      {/* Responsive content container */}
      <div className="p-3 sm:p-4 lg:p-6 rounded-lg border-2 w-full  overflow-hidden">
        <article className="prose prose-sm sm:prose-base lg:prose-lg prose-slate dark:prose-invert max-w-none prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-img:max-w-full prose-img:h-auto">
          {/* Ensure markdown content is responsive */}
          <div className="break-words overflow-wrap-anywhere">
            <ReactMarkdown>{post.body}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
};

export default ViewPostContent;
