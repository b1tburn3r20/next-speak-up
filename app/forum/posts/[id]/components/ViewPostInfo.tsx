import { FullForumPost } from "@/lib/types/forum-types";
import PostAuthor from "./Subcomponents/PostAuthor";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatIsoDate } from "@/lib/utils/StringFunctions";

import PostComments from "./Subcomponents/PostComments";
import PostClientSideTopComponents from "./Subcomponents/PostClientSideTopComponents";

interface ViewPostInfoProps {
  post: FullForumPost;
  userId: string | null;
}

const ViewPostInfo = ({ post, userId }: ViewPostInfoProps) => {
  return (
    <div className="w-full">
      {/* Mobile-first responsive header */}
      <div className="flex flex-col gap-2">
        {/* Top components - full width on mobile */}
        <div className="w-full sm:w-auto">
          <PostClientSideTopComponents post={post} userId={userId} />
        </div>

        {/* Author and date info - stacked on mobile, side by side on larger screens */}
        <div className="grid grid-cols:2 gap-2">
          <div className="w-full sm:w-auto">
            <PostAuthor postAuthor={post.author} />
          </div>

          <div className="w-full sm:w-auto">
            <Label className="text-primary block mb-1">Created on</Label>
            <p className="text-muted-foreground text-sm font-semibold break-words">
              {formatIsoDate(post.createdAt.toISOString())}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Comments section */}
      <div className="w-full">
        <PostComments post={post} userId={userId} />
      </div>
    </div>
  );
};

export default ViewPostInfo;
