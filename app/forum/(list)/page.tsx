import { PageSpacer } from "@/components/blocks";
import { AuthSession } from "@/lib/types/user-types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { ForumComposerArea } from "@/app/forum/components/forum-composer-area";
import ForumPosts from "@/app/forum/components/forum-posts";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getBillHeadline } from "@/lib/civic/bills";
export const metadata: Metadata = {
  title: "Coolbills Forum",
  description:
    "Forum for users to come together and discuss legislation or other parts of the application",
};

const Page = async ({ searchParams }: { searchParams: Promise<{ compose?: string; bill?: string }> }) => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userName = session?.user?.username;
  const params = await searchParams;
  // "Talk about it" on a bill lands here with the bill, so the post starts about it.
  const bill = params.bill ? await getBillHeadline(params.bill.slice(0, 80)) : null;
  return (
    <PageSpacer>
      <ForumComposerArea userId={userId} username={userName} startOpen={params.compose === "1" || Boolean(bill)} bill={bill} />
      <ForumPosts />
    </PageSpacer>
  );
};
export const dynamic = "force-dynamic";

export default Page;
