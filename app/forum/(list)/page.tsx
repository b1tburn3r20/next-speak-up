import { PageSpacer } from "@/components/blocks";
import { AuthSession } from "@/lib/types/user-types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { ForumComposerArea } from "@/app/forum/components/forum-composer-area";
import ForumPosts from "@/app/forum/components/forum-posts";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const metadata: Metadata = {
  title: "Coolbills Forum",
  description:
    "Forum for users to come together and discuss legislation or other parts of the application",
};

const Page = async ({ searchParams }: { searchParams: Promise<{ compose?: string }> }) => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userName = session?.user?.username;
  return (
    <PageSpacer>
      <ForumComposerArea userId={userId} username={userName} startOpen={(await searchParams).compose === "1"} />
      <ForumPosts />
    </PageSpacer>
  );
};
export const dynamic = "force-dynamic";

export default Page;
