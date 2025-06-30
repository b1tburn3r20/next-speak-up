import { FullForumPost } from "@/lib/types/forum-types";
import ReactMarkdown from "react-markdown";
import UserReferenceContainer from "./Subcomponents/UserRefranceContainer";

interface ViewPostContentProps {
  post: FullForumPost;
}

const ViewPostContent = ({ post }: ViewPostContentProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="text-primary text-3xl font-extrabold">{post.title}</div>

      <div className=" p-2 rounded-lg border-2">
        <article className="prose prose-sm sm:prose-base lg:prose-lg prose-slate dark:prose-invert max-w-none prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default ViewPostContent;
