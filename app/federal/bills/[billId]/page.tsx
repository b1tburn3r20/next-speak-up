import { legislationService } from "@/lib/services/legislation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { SponsorsAndCosponsors } from "./components/SponsorsAndCosponsors";

export default async function BillDetailsPage({
  params,
}: {
  params: { billId: string };
}) {
  const bill = await legislationService.getBillByNameId(params.billId);

  if (!bill) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Federal", href: "/federal" },
    { label: "Bills", href: "/federal/bills" },
    { label: bill.name_id || "" },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <PageBreadcrumb items={breadcrumbItems} />
        <PageHeader
          title={bill.title || "Untitled Bill"}
          description={`${bill.type} ${bill.number}`}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
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
            <SponsorsAndCosponsors
              sponsors={bill.sponsors}
              cosponsors={bill.cosponsors}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
