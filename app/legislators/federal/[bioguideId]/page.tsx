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

  return (
    <div className="p-4 flex justify-center items-start w-full">
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Card + PolicyAreaBreakdown: stacked on mobile, row on lg+ */}
          <div className="flex flex-col lg:flex-row gap-4">
            <CongressMemberCard congressMember={memberData} />
            <PolicyAreaBreakdown data={policyAreaBreakdown} />
          </div>
          <PolicyAreaBreakdownTable data={policyAreaBreakdown} />
        </div>

        {/* Right column: below everything on <xl, beside left col on xl */}
        <HouseVotesList votes={houseVoteData} />

      </div>
    </div>
  );
};

export default Page;
