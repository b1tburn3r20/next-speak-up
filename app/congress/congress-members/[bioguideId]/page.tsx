import { congressService } from "@/lib/services/congress";
import { legislationService } from "@/lib/services/legislation";
import { congressVotesService } from "@/lib/services/congress_two";
import { notFound } from "next/navigation";
import { CongressMemberConciseCard } from "./components/CongressMemberConciseCard";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { PolicyAreasTabsCard } from "./components/PolicyAreasTabsCard";
import { CongressLatestBills } from "./components/CongressLatestBills";
import { CongressMemberVotesCard } from "./components/CongressMemberVotesCard";
import { CongressMemberVoteTabs } from "./components/CongressMemberVotesTabs";
import CongressMemberGradeCard from "./components/CongressMemberGrade";
import { SponsoredLegislation } from "@/lib/services/legislation";
type BreadcrumbItem = {
  label: string;
  href?: string;
  dropdown?: { label: string; href: string }[];
};

export default async function CongressMemberPage({
  params,
}: {
  params: { bioguideId: string };
}) {
  // First, fetch the member
  const member = await congressService.getMemberById(params.bioguideId);

  if (!member) {
    notFound();
  }

  // Then fetch everything else using the member's ID
  const [
    legislationStats,
    sponsoredBills,
    cosponsoredBills,
    recentVotes,
    voteStats,
    votesByPolicyArea,
    memberGrade,
  ] = await Promise.all([
    legislationService.getAllLegislationStats(params.bioguideId),
    legislationService.getMemberBills({
      bioguideId: params.bioguideId,
      page: 1,
      limit: 5,
      includeSponsored: true,
      includeCosponsored: false,
      sortBy: "introducedDate",
      sortOrder: "desc",
    }),
    legislationService.getMemberBills({
      bioguideId: params.bioguideId,
      page: 1,
      limit: 5,
      includeSponsored: false,
      includeCosponsored: true,
      sortBy: "introducedDate",
      sortOrder: "desc",
    }),
    congressVotesService.getMemberRecentVotes(member.id),
    congressVotesService.getMemberVoteStats(member.id),
    congressVotesService.getMemberVotesByPolicyArea(member.id),
    congressVotesService.getCongressMemberGrade(member.id),
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Congress Members",
      href: "/congress/congress-members",
    },
    { label: `${member.firstName} ${member.lastName}` },
  ];
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <PageBreadcrumb items={breadcrumbItems} />
        <PageHeader
          title={`${member.firstName} ${member.lastName}`}
          description={`${
            member.terms[member.terms.length - 1].chamber
          } Member from ${member.state}`}
        />

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 space-y-6">
            <div className="flex gap-2">
              <CongressMemberConciseCard member={member} />
              {member.role !== "Senator" && (
                <CongressMemberGradeCard grade={memberGrade} />
              )}
            </div>
            {member.role !== "Senator" && (
              <CongressMemberVotesCard
                initialVotes={recentVotes}
                bioguideId={member.bioguideId}
                firstName={member.firstName}
                lastName={member.lastName}
              />
            )}
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <PolicyAreasTabsCard stats={legislationStats} />
            {member.role !== "Senator" && (
              <CongressMemberVoteTabs
                stats={voteStats}
                votesByPolicyArea={votesByPolicyArea}
              />
            )}

            <CongressLatestBills
              sponsoredBills={sponsoredBills.bills as SponsoredLegislation[]}
              cosponsoredBills={cosponsoredBills.bills}
              title={`Latest Bills by ${member.firstName} ${member.lastName}`}
            />
          </div>
        </div>

        <div className="mt-6"></div>
      </div>
    </div>
  );
}
