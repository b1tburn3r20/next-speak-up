import { legislationService } from "@/lib/services/legislation";
import { legislationVotesService } from "@/lib/services/legislation_two";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { SponsorsAndCosponsors } from "./components/SponsorsAndCosponsors";
import BillSummary from "./components/Summary/BillSummary";
import BillText from "./components/BillText";
import BillVotes from "./components/BillVotes";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BillAskAI from "./components/BillAskAI";
import VoteOnBill from "./components/UserVote/VoteOnBill";
import { UserFederalLegislationVoteModal } from "./components/UserVote/UserFederalLegislationVoteModal";
import { Metadata } from "next";
import { Legislation } from "@prisma/client";
import BillDetails from "./components/BillDetails";

// Define bill type for type safety

// Get bill data once and use it for both metadata and page
async function getBillData(billId: string) {
  const bill = await legislationService.getBillByNameId(billId);

  if (!bill) {
    notFound();
  }

  return bill;
}

// Generate metadata using the shared data
export async function generateMetadata({
  params,
}: {
  params: { billId: string };
}): Promise<Metadata> {
  const bill: Legislation = await getBillData(params.billId);

  const billIdentifier = `${bill.congress}${bill.type}${bill.number}`;
  const fullTitle = `${bill.title} | SpeakUp`;

  return {
    title: fullTitle,
    description: bill.summary
      ? `${bill.summary.substring(0, 155)}...`
      : `Details and tracking information for ${billIdentifier} in the ${bill.congress}th Congress`,
    keywords: [
      "Congress",
      "Legislation",
      "Bill",
      billIdentifier,
      "Federal Legislation",
    ].filter(Boolean),
    openGraph: {
      title: fullTitle,
      description:
        bill.summary?.substring(0, 155) ||
        `Track ${billIdentifier} in Congress`,
    },
    twitter: {
      title: fullTitle,
      description:
        bill.summary?.substring(0, 155) ||
        `Track ${billIdentifier} in Congress`,
    },
  };
}

export default async function BillDetailsPage({
  params,
  searchParams,
}: {
  params: { billId: string };
  searchParams: { vote?: string };
}) {
  const session = await getServerSession(authOptions);

  // Use the shared getBillData function
  const [bill, votes] = await Promise.all([
    getBillData(params.billId),
    legislationVotesService.getBillVotes(params.billId, session.user.id),
  ]);
  const userInfo = {
    id: session.user.id,
    name: session.user.name,
    image: session.user.image || "/path/to/default/avatar.png", // Fallback to default if no image
  };
  const breadcrumbItems = [
    { label: "Federal", href: "/federal" },
    { label: "Bills", href: "/federal/bills" },
    { label: bill.name_id || "" },
  ];

  // Check if the vote parameter is present
  const showVotePrompt = searchParams.vote === "true";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <PageBreadcrumb items={breadcrumbItems} />
        <PageHeader
          title={bill.title || "Untitled Bill"}
          description={`${bill.congress}${bill.type}${bill.number}`}
        />
        {/* allow the user to vote */}
        <UserFederalLegislationVoteModal
          bill={bill}
          searchParams={searchParams}
          votes={votes}
          userInfo={userInfo}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <BillSummary bill={bill} className="border-none shadow-none" />
            <BillDetails bill={bill} />

            <BillText
              congress={bill.congress}
              type={bill.type}
              number={bill.number}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BillVotes votes={votes} />
            <SponsorsAndCosponsors
              sponsors={bill.sponsors}
              cosponsors={bill.cosponsors}
            />
          </div>
        </div>
      </div>
      <BillAskAI
        congress={bill.congress}
        type={bill.type}
        number={bill.number}
        user={session}
      />
    </div>
  );
}
