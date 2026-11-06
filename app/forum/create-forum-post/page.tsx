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
    <div className="mx-auto max-w-3xl space-y-3 p-4 sm:p-6">
      <NewForumPostMessage />
      <NewForumPostForm />
      <NewFormSubmitButton />
    </div>
  );
};

export default Page;
