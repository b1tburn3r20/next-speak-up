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
import Link from "next/link";

interface CongressMemberCardProps {
  congressMember: ComprehensiveLegislatorData;
}

const WidgetRepCard = ({ congressMember }: CongressMemberCardProps) => {
  const position = congressMember.district
    ? `${congressMember.state}, District ${congressMember.district}`
    : `${congressMember.state} Senator`;
  const age = getCurrentYear() - Number(congressMember.birthYear);
  const reelectionInfo = getCongressMemberReelectionInfo(congressMember);
  const yearsServed = calculateYearsInOffice(congressMember.terms);

  const formatTimeUntilReelection = () => {
    if (!reelectionInfo) return null;
    const { years, months, days } = reelectionInfo;
    if (years > 0) return `${years}y ${months}mo`;
    if (months > 0) return `${months}mo ${days}d`;
    return `${days}d`;
  };

  return (
    <div className="bg-background-light shadow-md p-3 rounded-2xl h-fit w-full">
      <div className="flex gap-3 items-center mb-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {congressMember.depiction?.imageUrl && (
            <img
              src={congressMember.depiction.imageUrl}
              alt={congressMember.firstName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div>
          <div className="text-base font-medium leading-tight">
            {congressMember.firstName} {congressMember.lastName}
          </div>
          <div className="text-sm text-muted-foreground">{position}</div>
          <div className="text-sm text-muted-foreground">
            {congressMember.district ? "House · " : ""}{congressMember.active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {[
          { label: "Age", value: age },
          { label: "Terms", value: yearsServed },
        ].map(({ label, value }) => (
          <React.Fragment key={label}>
            <div className="flex items-center justify-between gap-8">
              <span className="text-sm text-muted-foreground">{label}</span>
              <NumberTicker className="text-sm font-medium" value={value} />
            </div>
            <Separator />
          </React.Fragment>
        ))}
        <div className="flex items-center justify-between gap-8">
          <span className="text-sm text-muted-foreground">Next election</span>
          <span className="text-sm font-medium">{formatTimeUntilReelection() ?? "—"}</span>
        </div>
      </div>
      <Link href={`/legislators/federal/${congressMember?.bioguideId}`}>
        <Button className="w-full mt-3 h-8 text-sm">View more</Button>
      </Link>
    </div>);
};

export default WidgetRepCard;
