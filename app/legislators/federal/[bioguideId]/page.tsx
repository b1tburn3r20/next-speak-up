import { getComprehensiveLegislatorInformation, getLegislatorHouseVotePolicyAreaBreakdown, getLegislatorRecentHouseVotes } from "@/lib/services/legislators/legislator-id";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import CongressMemberCard from "./components/CongressMemberCard";
import PolicyAreaBreakdown from "./components/PolicyAreaBreakdown";
import HouseVotesList from "./components/HouseVoteList";

interface PageProps {
  params: Promise<{
    bioguideId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role?.name;
  const bioguideId = (await params).bioguideId;

  const memberData = await getComprehensiveLegislatorInformation(
    bioguideId,
    userId,
    userRole
  );
  const houseVoteData = await getLegislatorRecentHouseVotes(
    bioguideId,
  );

  const policyAreaBreakdown = await getLegislatorHouseVotePolicyAreaBreakdown(
    bioguideId,
  );


  return (
    <div className="p-4">
      <CongressMemberCard congressMember={memberData} />{" "}
      <PolicyAreaBreakdown data={policyAreaBreakdown} />
      <HouseVotesList votes={houseVoteData} />
    </div>
  );
};

export default Page;
