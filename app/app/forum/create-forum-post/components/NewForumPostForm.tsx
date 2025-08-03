import NewForumBody from "./NewForumBody";
import NewForumPostTitle from "./NewForumPostTitle";
import NewForumType from "./NewForumType";

const NewForumPostForm = () => {
  return (
    <div className="flex space-y-2 flex-col">
      <NewForumType />
      <NewForumPostTitle />
      <NewForumBody />
    </div>
  );
};

export default NewForumPostForm;
