import { getComprehensiveLegislatorInformation, getLegislatorHouseVotePolicyAreaBreakdown, getLegislatorRecentHouseVotes } from "@/lib/services/legislators/legislator-id";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import CongressMemberCard from "./components/CongressMemberCard";
import PolicyAreaBreakdown from "./components/PolicyAreaBreakdown";
import HouseVotesList from "./components/HouseVoteList";
import PolicyAreaBreakdownTable from "./components/PolicyAreaBreakdownTable";

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

  console.log(memberData)
  return (
    <div className="p-4 flex justify-center items-center w-full h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <CongressMemberCard congressMember={memberData} />
            <PolicyAreaBreakdown data={policyAreaBreakdown} />
          </div>
          <PolicyAreaBreakdownTable data={policyAreaBreakdown} />
        </div>
        <HouseVotesList votes={houseVoteData} />
      </div>
    </div>
  );
};

export default Page;
