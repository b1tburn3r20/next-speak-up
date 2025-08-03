import { ForumPostAuthor } from "@/lib/types/forum-types";
import UserReferenceContainer from "./UserRefranceContainer";
import { Label } from "@/components/ui/label";

interface PostAuthorProps {
  postAuthor: ForumPostAuthor;
}

const PostAuthor = ({ postAuthor }: PostAuthorProps) => {
  return (
    <div>
      <Label className="text-primary ">Author:</Label>
      <UserReferenceContainer
        id={postAuthor.id}
        username={postAuthor.username}
        image={postAuthor.image}
        role={postAuthor.role.name}
      />
    </div>
  );
};

export default PostAuthor;
