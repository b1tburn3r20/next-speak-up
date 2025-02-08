// app/congress/congress-members/page.tsx
import { Metadata } from "next";
import { congressService } from "@/lib/services/congress";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { CongressMemberCard } from "../components/CongressMemberCard";
import {
  CongressSearch,
  CongressPagination,
} from "./components/CongressSearchAndPagination";

export const metadata: Metadata = {
  title: "Congress Members | Speakup",
  description: "Browse and search through all current members of Congress",
  openGraph: {
    title: "Congress Members",
    description: "Complete directory of current Congress members",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "Congress",
    "Representatives",
    "Senators",
    "Government",
    "Politics",
  ],
};

export default async function CongressMembersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams.page) || 1;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : "";

  const { members, pagination } = query
    ? await congressService.searchMembers(query, page)
    : await congressService.getAllMembers(page);

  const breadcrumbItems = [
    {
      label: "Sections",
      dropdown: [
        { label: "Senate", href: "/government/congress/senate" },
        { label: "House", href: "/government/congress/house" },
        { label: "Leadership", href: "/government/congress/leadership" },
        { label: "Committees", href: "/government/congress/committees" },
      ],
    },
    { label: "Congress Members" },
  ];

  return (
    <div className="container mx-auto py-6">
      <PageBreadcrumb items={breadcrumbItems} />
      <PageHeader
        title="All Current Congress Members"
        description={`Showing ${members.length} of ${pagination.total} members`}
        className="mb-6"
      />

      <CongressSearch />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <CongressMemberCard key={member.bioguideId} member={member} />
        ))}
      </div>

      <CongressPagination
        total={pagination.total}
        currentPage={pagination.currentPage}
        perPage={pagination.perPage}
      />
    </div>
  );
}
