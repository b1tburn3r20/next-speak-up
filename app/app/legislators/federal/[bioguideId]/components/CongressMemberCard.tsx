import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import { ComprehensiveLegislatorData } from "@/lib/types/legislator-types";
import {
  calculateYearsInOffice,
  getCongressMemberReelectionInfo,
  getCurrentYear,
  getTermsBreakdown,
} from "@/lib/utils/legislator-utils";
import NumberTicker from "@/components/ui/number-ticker";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ContactLegislator from "../../../components/ContactLegislator";

interface CongressMemberCardProps {
  congressMember: ComprehensiveLegislatorData;
}

const CongressMemberCard = ({ congressMember }: CongressMemberCardProps) => {
  const position = congressMember.district
    ? `${congressMember.state}-${congressMember.district}`
    : `${congressMember.state} Senator`;

  const age = getCurrentYear() - Number(congressMember.birthYear);

  // Get reelection info using our functions
  const reelectionInfo = getCongressMemberReelectionInfo(congressMember);

  const yearsServed = calculateYearsInOffice(congressMember.terms);
  const formatTimeUntilReelection = () => {
    if (!reelectionInfo) return null;

    const { years, months, days } = reelectionInfo;

    if (years > 0) {
      return `${years} year ${months} months until reelection`;
    } else if (months > 0) {
      return `${months} months ${days} days until reelection`;
    } else {
      return `${days} days until reelection`;
    }
  };
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {congressMember.depiction?.imageUrl && (
            <img
              src={congressMember.depiction.imageUrl}
              alt={congressMember.firstName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">
            {congressMember.firstName} {congressMember.lastName}{" "}
          </CardTitle>
          <CardDescription>
            <div>
              <p>{position}</p>
              <p>{congressMember.active ? "In congress" : "Inactive"}</p>
              {reelectionInfo && <p>{formatTimeUntilReelection()}</p>}
            </div>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-lg text-primary font-bold">Age:</span>
          <NumberTicker
            className="font-semibold text-lg"
            value={age}
          ></NumberTicker>
        </div>{" "}
        <Separator className="my-1" />
        <div className="flex items-center justify-between">
          <span className="text-lg text-primary font-bold">Terms Served:</span>
          <NumberTicker
            className="font-semibold text-lg"
            value={yearsServed}
          />{" "}
        </div>
        <ContactLegislator legislator={congressMember} />
      </CardContent>
    </Card>
  );
};

export default CongressMemberCard;
