import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Legislation } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface BillDetailsProps {
  bill: Legislation;
}

const BillDetails = ({ bill }: BillDetailsProps) => {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-2 border-b mb-2">
        <CardTitle>Bill Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                <span>
                  Introduced{" "}
                  {bill.introducedDate
                    ? format(new Date(bill.introducedDate), "MMMM d, yyyy")
                    : "Date unknown"}
                </span>
              </div>

              {/* {bill.policy_area?.name && (
                <div>
                  <Badge variant="secondary">{bill.policy_area.name}</Badge>
                </div>
              )} */}

              {bill.url && (
                <Link
                  href={`https://www.congress.gov/bill/${
                    bill.congress
                  }-congress/${
                    bill.type.startsWith("H") ? "house-bill" : "senate-bill"
                  }/${bill.number}`}
                  target="_blank"
                  className="inline-flex items-center space-x-2 text-sm text-primary hover:text-primary/80"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  <span>View on Congress.gov</span>
                </Link>
              )}
            </div>
          </div>

          {bill.latest_action && (
            <div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Latest Action</h3>
                <p className="text-sm text-muted-foreground">
                  {bill.latest_action.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bill.latest_action.action_date
                    ? formatDistanceToNow(
                        new Date(bill.latest_action.action_date),
                        {
                          addSuffix: true,
                        }
                      )
                    : "Date unknown"}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillDetails;
