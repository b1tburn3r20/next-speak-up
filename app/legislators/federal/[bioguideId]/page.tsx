import {
  getComprehensiveLegislatorInformation,
  getLegislatorHouseVotePolicyAreaBreakdown,
  getLegislatorRecentHouseVotes,
  getLegislatorSponsorshipPolicyAreaBreakdown,
} from "@/lib/services/legislators/legislator-id";
import CongressMemberCard from "./components/CongressMemberCard";
import PolicyAreaBreakdown from "./components/PolicyAreaBreakdown";
import SponsorPolicyAreaBreakdown from "./components/SponsorPolicyAreaBreakdown";
import SponsorBillsTable from "./components/SponsorBillsTable";
import HouseVotesList from "./components/HouseVoteList";
import { Metadata } from "next";
import CongressMemberNetWorthChart from "./components/congress-member-net-worth-chart";
import CongressMemberPromiseKeptRatio from "./components/congress-member-promise-kept-ratio";
import CongressMemberThroughputRatio from "./components/congress-member-legislation-throughput-ratio";

interface PageProps {
  params: Promise<{ bioguideId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const bioguideId = (await params).bioguideId;
  const memberData = await getComprehensiveLegislatorInformation(bioguideId);
  return {
    title: `Coolbills | ${memberData?.role?.includes("Rep") ? "Rep" : "Senator"} ${memberData?.firstName ? `${memberData?.firstName} ${memberData?.lastName}` : ""} `,
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
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            <CongressMemberCard congressMember={memberData} />
            <PolicyAreaBreakdown data={policyAreaBreakdown} />
            <SponsorPolicyAreaBreakdown data={breakdown} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CongressMemberNetWorthChart />
          <CongressMemberPromiseKeptRatio />
          <CongressMemberThroughputRatio />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full">
            <HouseVotesList votes={houseVoteData} />
          </div>
          <div className="w-full">
            <SponsorBillsTable bills={bills} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
