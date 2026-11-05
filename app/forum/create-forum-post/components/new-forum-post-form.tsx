import NewForumBody from "./new-forum-body";
import NewForumPostTitle from "./new-forum-post-title";
import NewForumType from "./new-forum-type";

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
