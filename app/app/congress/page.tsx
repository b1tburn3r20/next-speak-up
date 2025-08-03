import { Metadata } from "next";
// import { congressService } from "@/lib/services/congress";
import { PageHeader } from "../PageComponents/PageHeader";
import { PageBreadcrumb } from "../PageComponents/PageBreadcrumb";
import { CongressMemberCard } from "./components/CongressMemberCard";

export const metadata: Metadata = {
  title: "Congress Members | Coolbills",
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

export default async function CongressPage() {
  // const { members, pagination } = await congressService.getAllMembers();

  const breadcrumbItems = [
    { label: "Government", href: "/government" },
    { label: "Congress Members" },
  ];

  return <div>Hello</div>;
  // return (
  //   <div className="container mx-auto py-6">
  //     <PageBreadcrumb items={breadcrumbItems} />
  //     <PageHeader
  //       title="All Congress Members"
  //       description={`Showing ${members.length} of ${pagination.total} members`}
  //       className="mb-6"
  //     />

  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //       {members.map((member) => (
  //         <CongressMemberCard key={member.bioguideId} member={member} />
  //       ))}
  //     </div>

  //     <div className="mt-6 text-center text-sm text-muted-foreground">
  //       Page {pagination.currentPage} of {pagination.pages}
  //     </div>
  //   </div>
  // );
}
