import { PageHeader, PageShell } from "@/components/blocks";
import { AuthSession } from "@/lib/types/user-types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import CreateForumPostLink from "./components/create-forum-post-link";
import ForumPosts from "./components/forum-posts";
import { authOptions } from "../api/auth/[...nextauth]/route";
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
    <PageShell>
      <PageHeader
        title="Forum"
        description="Talk about bills and the app with other people."
        action={<CreateForumPostLink userId={userId} username={userName} />}
      />
      <ForumPosts />
    </PageShell>
  );
};
export const dynamic = "force-dynamic";

export default Page;
