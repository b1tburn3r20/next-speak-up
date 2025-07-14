import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import LegislatorCard from "./LegislatorCard";
import { TextAnimate } from "@/components/magicui/text-animate";

interface AllActiveLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string | null;
}
const AllActiveLegislators = ({
  legislators,
  userId,
}: AllActiveLegislatorsProps) => {
  return (
    <div>
      <TextAnimate className="text-4xl m-4 font-bold [&>span:first-child]:text-primary">
        All Active Legislators
      </TextAnimate>
      {legislators.map((legislator) => (
        <LegislatorCard
          key={legislator.bioguideId}
          legislator={legislator}
          userId={userId}
        />
      ))}
    </div>
  );
};

export default AllActiveLegislators;
