import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { getServerSession } from "next-auth";
import LatestBillsWidget from "../dashboard-components/widgets/LatestBillsWidget";
import NoUserDashboard from "./components/no-user-dashboard";
import UserPersonalizedDashboard from "./components/user-personalized-dashboard";
import { Metadata } from "next";
import OuterBlock from "@/components/cb/outer-block";
import DashboardVotingThisWeek from "./components/dashboard-voting-this-week";
import DashboardSearches from "./components/dashboard-searches";
import DashboardGreeting from "./components/dashboard-greeting";
import SideBlock from "@/components/cb/side-block";

export const metadata: Metadata = {
  title: "Coolbills | Personalized Dashboard",
  description: "See what your representative is up to",
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <SideBlock className="justify-between">
        <DashboardGreeting session={session} />
        <DashboardSearches />
      </SideBlock>
      <DashboardVotingThisWeek />
      <OuterBlock>
        {session?.user?.id ? (
          <UserPersonalizedDashboard />
        ) : (
          <NoUserDashboard />
        )}
      </OuterBlock>
      <OuterBlock className="p-4">
        <LatestBillsWidget />
      </OuterBlock>
    </div>
  );
}
