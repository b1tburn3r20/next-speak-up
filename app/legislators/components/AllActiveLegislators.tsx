"use client";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import LegislatorCard from "./LegislatorCard";
import { TextAnimate } from "@/components/magicui/text-animate";
import Link from "next/link";
import { states } from "@/app/data/states";

interface AllActiveLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string | null;
}

const AllActiveLegislators = ({
  legislators,
  userId,
}: AllActiveLegislatorsProps) => {
  const sortedLegislators = [...legislators].sort((a, b) => {
    const stateCompare = a.state.localeCompare(b.state);
    if (stateCompare !== 0) return stateCompare;
    // sort by district
    const districtA = a.district ? parseInt(a.district) : 0;
    const districtB = b.district ? parseInt(b.district) : 0;
    return districtA - districtB;
  });

  interface CongressMemberListItemProps {
    congressMember: SimpleLandingPageLegislatorData;
    index: number;
  }
  const CongressMemberListItem = ({
    congressMember,
    index,
  }: CongressMemberListItemProps) => {
    return (
      <Link href={`/legislators/federal/${congressMember.bioguideId}`}>
        <div
          className={`flex text-lg gap-2 p-2 ${
            index % 2 === 0 ? "bg-muted/40" : ""
          }`}
        >
          <p className="text-primary font-bold">{congressMember.state}</p>
          <p>{congressMember.name}</p>
          <p>{congressMember.role}</p>
          <p>
            {congressMember.district
              ? `District ${congressMember.district}`
              : "Senator"}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="">
      <TextAnimate className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:first-child]:text-primary">
        All Active Legislators
      </TextAnimate>
      <div className="flex flex-col">
        {sortedLegislators.map((legislator, index) => (
          <CongressMemberListItem
            congressMember={legislator}
            index={index}
            key={index}
          />
        ))}
        )
      </div>
    </div>
  );
};

export default AllActiveLegislators;
