import { TextAnimate } from "@/components/magicui/text-animate";
import { AuthSession } from "@/lib/types/user-types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import CreateForumPostLink from "./components/CreateForumPostLink";
import ForumPosts from "./components/ForumPosts";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const metadata: Metadata = {
  title: "Coolbills Forum",
  description:
    "Forum for users to come together and discuss legislation or other parts of the application",
};

const Page = async () => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userName = session?.user?.username;
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="text-4xl m-4 font-bold [&>span:last-child]:text-primary"
        >
          Coolbills Forum
        </TextAnimate>
        <div className="m-2 lg:m-0">
          <CreateForumPostLink userId={userId} username={userName} />
        </div>
      </div>
      <div>
        <ForumPosts />
      </div>
    </div>
  );
};
export const dynamic = "force-dynamic";

export default Page;
