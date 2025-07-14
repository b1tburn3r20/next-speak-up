import { TextAnimate } from "@/components/magicui/text-animate";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";

interface LegislatorCardProps {
  userId: string | null;
  legislator: SimpleLandingPageLegislatorData;
}
const LegislatorCard = ({ userId, legislator }: LegislatorCardProps) => {
  return (
    <div>
      <div className="flex justify-center">
        <p>{legislator.name}</p>
        <p>{legislator.state}</p>
      </div>
      <p>{legislator.bioguideId} </p>
    </div>
  );
};

export default LegislatorCard;
