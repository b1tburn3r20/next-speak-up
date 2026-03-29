import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { TextAnimate } from "@/components/magicui/text-animate";
import LatestBillsWidget from "../dashboard-components/widgets/LatestBillsWidget";
import BlockA from "@/components/cb/block-a";
import NoUserDashboard from "./components/no-user-dashboard";
import UserPersonalizedDashboard from "./components/user-personalized-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coolbills | Personalized Dashboard",
  description: "See what your representative is up to",
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <BlockA className="w-fit p-4">
        <TextAnimate className="text-4xl font-bold [&>span:first-child]:text-primary">
          {session?.user?.id ? `Hello, ${session.user.name}` : "Hi there."}
        </TextAnimate>
        <TextAnimate className="text-lg text-muted-foreground">
          We're glad you're here, one step at a time we can make a difference.
        </TextAnimate>
      </BlockA>
      <BlockA>
        {session?.user?.id ? (
          <UserPersonalizedDashboard />
        ) : (
          <NoUserDashboard />
        )}
      </BlockA>
      <BlockA className="p-4">
        <LatestBillsWidget />
      </BlockA>
    </div>
  );
}
