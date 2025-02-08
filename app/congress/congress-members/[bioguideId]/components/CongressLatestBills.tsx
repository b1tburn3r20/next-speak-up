import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Bill = {
  id: number;
  title: string | null;
  type: string | null;
  number: string | null;
  introducedDate: Date | null;
  url: string | null;
  name_id: string | null;
};

type CongressLatestBillsProps = {
  sponsoredBills: Bill[];
  cosponsoredBills: Bill[];
  title?: string;
};

const BillLink = ({ bill }: { bill: Bill }) => (
  <div className="py-2">
    <Link
      href={`/federal/bills/${bill.name_id?.toLowerCase()}`}
      className="text-sm text-muted-foreground flex items-center justify-between group"
    >
      <span className="line-clamp-1 flex-1 group-hover:text-primary">
        {bill.title}
      </span>
      {bill.introducedDate && (
        <span className="text-xs">
          {formatDistanceToNow(new Date(bill.introducedDate), {
            addSuffix: true,
          })}
        </span>
      )}
    </Link>
  </div>
);

export const CongressLatestBills = ({
  sponsoredBills,
  cosponsoredBills,
  title = "Latest Bills",
}: CongressLatestBillsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Sponsored Bills</h3>
            <div className="space-y-1">
              {sponsoredBills.map((bill) => (
                <BillLink key={bill.id} bill={bill} />
              ))}
              {sponsoredBills.length === 0 && (
                <p className="text-sm py-2">No sponsored bills found</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Cosponsored Bills</h3>
            <div className="space-y-1">
              {cosponsoredBills.map((bill) => (
                <BillLink key={bill.id} bill={bill} />
              ))}
              {cosponsoredBills.length === 0 && (
                <p className="text-sm py-2">No cosponsored bills found</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
