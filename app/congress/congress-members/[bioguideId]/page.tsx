import { congressService } from "@/lib/services/congress";
import { legislationService } from "@/lib/services/legislation";
import { notFound } from "next/navigation";
import { CongressMemberConciseCard } from "./components/CongressMemberConciseCard";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { PolicyAreasTabsCard } from "./components/PolicyAreasTabsCard";

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
  const [member, legislationStats] = await Promise.all([
    congressService.getMemberById(params.bioguideId),
    legislationService.getAllLegislationStats(params.bioguideId),
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
    { label: "Members", href: "/government/congress/members" },
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
          </div>

          <div className="w-full md:w-1/2">
            <PolicyAreasTabsCard stats={legislationStats} />
          </div>
        </div>
      </div>
    </div>
  );
}
