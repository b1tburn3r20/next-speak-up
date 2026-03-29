import {
  getComprehensiveLegislatorInformation,
  getLegislatorHouseVotePolicyAreaBreakdown,
  getLegislatorRecentHouseVotes,
  getLegislatorSponsorshipPolicyAreaBreakdown,
} from "@/lib/services/legislators/legislator-id";
import CongressMemberCard from "./components/CongressMemberCard";
import PolicyAreaBreakdown from "./components/PolicyAreaBreakdown";
import SponsorPolicyAreaBreakdown from "./components/SponsorPolicyAreaBreakdown";
import SponsorPolicyAreaBreakdownTable from "./components/SponsorPolicyAreaBreakdownTable";
import SponsorBillsTable from "./components/SponsorBillsTable";
import HouseVotesList from "./components/HouseVoteList";
import PolicyAreaBreakdownTable from "./components/PolicyAreaBreakdownTable";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ bioguideId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const bioguideId = (await params).bioguideId;
  const memberData = await getComprehensiveLegislatorInformation(bioguideId);
  return {
    title: `Coolbills | ${memberData?.name ?? "Legislator"} Details`,
  };
}

const Page = async ({ params }: PageProps) => {
  const bioguideId = (await params).bioguideId;

  const [memberData, houseVoteData, policyAreaBreakdown, { breakdown, bills }] =
    await Promise.all([
      getComprehensiveLegislatorInformation(bioguideId),
      getLegislatorRecentHouseVotes(bioguideId),
      getLegislatorHouseVotePolicyAreaBreakdown(bioguideId),
      getLegislatorSponsorshipPolicyAreaBreakdown(bioguideId),
    ]);

  return (
    <div className="p-4 flex justify-center items-start w-full">
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left column — member card + sponsorship */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <CongressMemberCard congressMember={memberData} />
            <SponsorPolicyAreaBreakdown data={breakdown} />
          </div>
          <SponsorPolicyAreaBreakdownTable data={breakdown} />
          <PolicyAreaBreakdown data={policyAreaBreakdown} />
          <PolicyAreaBreakdownTable data={policyAreaBreakdown} />
        </div>

        <div className="flex flex-col gap-4">
          <SponsorBillsTable bills={bills} />
          <HouseVotesList votes={houseVoteData} />
        </div>
      </div>
    </div>
  );
};

export default Page;
