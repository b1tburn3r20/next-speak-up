"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  SponsoredLegislation,
  PolicyAreaCount,
} from "@/lib/services/legislation";
import { PolicyAreasPieChart } from "./PolicyAreasPieChart";

interface LegislationOverviewProps {
  recentBills: SponsoredLegislation[];
  topPolicyAreas: PolicyAreaCount[];
  totalBills: number;
  totalPassed: number;
  cosponsoredTopPolicyAreas?: PolicyAreaCount[];
  cosponsoredTotalBills?: number;
  cosponsoredTotalPassed?: number;
}

export const LegislationOverview: React.FC<LegislationOverviewProps> = ({
  recentBills,
  topPolicyAreas,
  totalBills,
  totalPassed,
  cosponsoredTopPolicyAreas,
  cosponsoredTotalBills,
  cosponsoredTotalPassed,
}) => {
  console.log("Regular Policy Areas:", topPolicyAreas);
  console.log("Cosponsored Policy Areas:", cosponsoredTopPolicyAreas);

  return (
    <Card className="w-full max-w-md border-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-xl">
            <span>Legislative Overview</span>
            <Badge variant="secondary" className="ml-2">
              {totalPassed} of {totalBills} Passed
            </Badge>
          </div>
          {cosponsoredTotalBills !== undefined && (
            <div className="flex items-center space-x-2 text-xl">
              <span>Cosponsored Bills</span>
              <Badge variant="secondary" className="ml-2">
                {cosponsoredTotalPassed} of {cosponsoredTotalBills} Passed
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-6">
        <PolicyAreasPieChart topPolicyAreas={topPolicyAreas} />
        {cosponsoredTopPolicyAreas && (
          <>
            <Separator />
            <PolicyAreasPieChart topPolicyAreas={cosponsoredTopPolicyAreas} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LegislationOverview;
