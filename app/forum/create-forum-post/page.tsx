import NewFormSubmitButton from "./components/new-form-submit-button";
import NewForumPostForm from "./components/new-forum-post-form";
import NewForumPostMessage from "./components/new-forum-post-message";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Forum Post",
  description: "Create a forum post on the Coolbills App",
};

const Page = () => {
  return (
    <div className="space-y-2 p-2 lg:p-0 ">
      <NewForumPostMessage />
      <NewForumPostForm />
      <NewFormSubmitButton />
    </div>
  );
};

export default Page;
