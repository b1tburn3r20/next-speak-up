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
    <div>
      <div className="flex justify-between items-center">
        <PostClientSideTopComponents post={post} userId={userId} />

        <div className="flex items-start gap-8">
          <PostAuthor postAuthor={post.author} />

          <div>
            <Label className="text-primary">Created on</Label>
            <p className="text-muted-foreground text-sm font-semibold">
              {formatIsoDate(post.createdAt.toISOString())}
            </p>
          </div>
        </div>
      </div>
      <Separator className="my-2" />
      <div>
        <PostComments post={post} userId={userId} />
      </div>
    </div>
  );
};

export default ViewPostInfo;
