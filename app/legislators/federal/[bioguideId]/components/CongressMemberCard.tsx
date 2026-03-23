import React from "react";
import { ComprehensiveLegislatorData } from "@/lib/types/legislator-types";
import {
  calculateYearsInOffice,
  getCongressMemberReelectionInfo,
  getCurrentYear,
} from "@/lib/utils/legislator-utils";
import NumberTicker from "@/components/ui/number-ticker";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dot } from "lucide-react";

interface CongressMemberCardProps {
  congressMember: ComprehensiveLegislatorData;
}

const CongressMemberCard = ({ congressMember }: CongressMemberCardProps) => {
  const position = congressMember.district
    ? `${congressMember.state}, District ${congressMember.district}`
    : `${congressMember.state} Senator`;

  const age = getCurrentYear() - Number(congressMember.birthYear);

  const reelectionInfo = getCongressMemberReelectionInfo(congressMember);

  const yearsServed = calculateYearsInOffice(congressMember.terms);
  const formatTimeUntilReelection = () => {
    if (!reelectionInfo) return null;

    const { years, months, days } = reelectionInfo;

    if (years > 0) {
      return `${years} year ${months} months`;
    } else if (months > 0) {
      return `${months} months ${days} days`;
    } else {
      return `${days} days`;
    }
  };
  return (
    <div className="w-full h-full flex flex-col gap-4 bg-background shadow-md p-2 rounded-3xl">
      <div className="flex flex-row items-center gap-4 space-y-0 p-3 rounded-3xl bg-background-light shadow-md">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
          {congressMember.depiction?.imageUrl && (
            <img
              src={congressMember.depiction.imageUrl}
              alt={congressMember.firstName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="text-xl">
            {congressMember.firstName} {congressMember.lastName}{" "}
          </div>
          <p className="text-muted-foreground">{position}</p>
          <div className="flex items-center">
            <p className="text-muted-foreground">{congressMember.district ? "House" : ""}</p>
            <Dot className="text-muted-foreground" />
            <p className="text-muted-foreground">{congressMember.active ? "Active" : "Inactive"}</p>
          </div>
        </div>
      </div>
      <div className="h-full flex flex-col justify-between bg-background-light p-3 rounded-3xl shadow-md ">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground font-bold">Age:</span>
            <NumberTicker
              className="font-semibold text-lg"
              value={age}
            ></NumberTicker>
          </div>{" "}
          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground font-bold">Terms:</span>
            <NumberTicker
              className="font-semibold text-lg"
              value={yearsServed}
            />{" "}
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground font-bold">Sponsored:</span>
            <NumberTicker
              className="font-semibold text-lg"
              value={congressMember?.sponsoredLegislationCount}
            />{" "}
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground font-bold">Cosponsored:</span>
            <NumberTicker
              className="font-semibold text-lg"
              value={congressMember?.cosponsoredLegislationCount}
            />{" "}
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-lg text-muted-foreground font-bold whitespace-nowrap">Elections In:</span>
            {reelectionInfo && <p className="text-md whitespace-nowrap">{formatTimeUntilReelection()}</p>}
          </div>

        </div>

        <Button className="w-full mt-2">Contact</Button>
      </div>
    </div>
  );
};

export default CongressMemberCard;
