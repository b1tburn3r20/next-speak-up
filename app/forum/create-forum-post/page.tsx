import NewFormSubmitButton from "./components/NewFormSubmitButton";
import NewForumPostForm from "./components/NewForumPostForm";
import NewForumPostMessage from "./components/NewForumPostMessage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Forum Post",
  description: "Create a forum post on the Together App",
};

const Page = () => {
  return (
    <div className="space-y-2">
      <NewForumPostMessage />
      <NewForumPostForm />
      <NewFormSubmitButton />
    </div>
  );
};

export default Page;
