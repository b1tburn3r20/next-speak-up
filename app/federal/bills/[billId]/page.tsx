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
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <BillSummary bill={bill} />
            <BillText
              congress={bill.congress}
              type={bill.type}
              number={bill.number}
            />
            <Card>
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    Introduced{" "}
                    {bill.introducedDate
                      ? format(new Date(bill.introducedDate), "MMMM d, yyyy")
                      : "Date unknown"}
                  </span>
                </div>

                {bill.policy_area?.name && (
                  <div>
                    <Badge variant="secondary">{bill.policy_area.name}</Badge>
                  </div>
                )}

                {bill.latest_action && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Latest Action</h3>
                    <p className="text-sm text-muted-foreground">
                      {bill.latest_action.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bill.latest_action.action_date
                        ? formatDistanceToNow(
                            new Date(bill.latest_action.action_date),
                            { addSuffix: true }
                          )
                        : "Date unknown"}
                    </p>
                  </div>
                )}

                {bill.url && (
                  <Link
                    href={bill.url}
                    target="_blank"
                    className="inline-flex items-center space-x-2 text-sm text-primary hover:text-primary/80"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    <span>View on Congress.gov</span>
                  </Link>
                )}
              </CardContent>
            </Card>
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
