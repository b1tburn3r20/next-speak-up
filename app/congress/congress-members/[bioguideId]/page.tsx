import { congressService } from "@/lib/services/congress";
import { legislationService } from "@/lib/services/legislation";
import { notFound } from "next/navigation";
import { CongressMemberConciseCard } from "./components/CongressMemberConciseCard";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { PolicyAreasTabsCard } from "./components/PolicyAreasTabsCard";
import { CongressLatestBills } from "./components/CongressLatestBills";

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
  const [member, legislationStats, sponsoredBills, cosponsoredBills] =
    await Promise.all([
      congressService.getMemberById(params.bioguideId),
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
    ]);

  if (!member) {
    notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Congress", href: "/government/congress" },
    {
      label: "Sections",
      dropdown: [
        { label: "Senate", href: "/government/congress/senate" },
        { label: "House", href: "/government/congress/house" },
        { label: "Leadership", href: "/government/congress/leadership" },
        { label: "Committees", href: "/government/congress/committees" },
      ],
    },
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
          <div className="w-full md:w-1/2">
            <CongressMemberConciseCard member={member} />
            <CongressLatestBills
              sponsoredBills={sponsoredBills.bills}
              cosponsoredBills={cosponsoredBills.bills}
              title={`Latest Bills by ${member.firstName} ${member.lastName}`}
            />
          </div>

          <div className="w-full md:w-1/2">
            <PolicyAreasTabsCard stats={legislationStats} />
          </div>
        </div>

        <div className="mt-6"></div>
      </div>
    </div>
  );
}
