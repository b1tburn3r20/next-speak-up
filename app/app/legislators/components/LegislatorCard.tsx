import { TextAnimate } from "@/components/magicui/text-animate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ComprehensiveLegislatorData } from "@/lib/types/legislator-types";
import { ArrowRight, User } from "lucide-react";
import Link from "next/link";

interface LegislatorCardProps {
  userId: string | null;
  legislator: ComprehensiveLegislatorData;
}
const LegislatorCard = ({ userId, legislator }: LegislatorCardProps) => {
  console.log("This is the legislator", legislator);
  return (
    <Link href={`/app/legislators/federal/${legislator.bioguideId}`}>
      <Card className="h-[180px] w-[350px] flex flex-col items-start  select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2  rounded-3xl">
        {/* Subtle gradient overlay for consistency */}
        <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/60 to-background z-10 pointer-events-none" />

        <div className="p-4  h-full flex flex-col relative items-start justify-start text-start">
          {/* Icon at the top */}
          <div className=" relative  gap-4 flex items-center">
            <div className="w-16 h-16 shrink-0 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-all duration-300">
              <Avatar className="h-full w-full">
                <AvatarFallback>
                  {legislator.firstName[0]}
                  {legislator.lastName[0]}
                </AvatarFallback>
                <AvatarImage src={legislator.depiction.imageUrl} />
              </Avatar>
            </div>
            <div className="relative ">
              <h3 className="text-2xl font-bold text-primary group-hover:text-muted-foreground transition-colors duration-300">
                {legislator.name}
              </h3>
              <p className="text-start text-lg font-semibold text-muted-foreground">
                {" "}
                {legislator.district ? "Representative" : "Senator"}{" "}
              </p>
            </div>
          </div>

          {/* Title */}

          {/* Message */}
          <div className="relative ">
            <p className="text-2xl  font-extrabold text-foreground leading-relaxed max-w-xs group-hover:text-muted-foreground/80 transition-colors duration-300">
              <span className="text-primary ">{legislator.state}, </span>
              <span className="text-nowrap">
                {legislator.district
                  ? `District ${legislator.district}`
                  : "Senator"}
              </span>
            </p>
          </div>

          {/* Bottom action area with primary border on hover */}

          <div className="absolute top-0 left-0 right-0 h-[180px] w-[350px] ">
            <div className="flex items-center justify-center border-2 border-transparent h-full w-full group-hover:border-primary group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-3xl p-4 transition-all duration-500 ease-out">
              {/* Action text */}
              <span className="text-lg font-bold text-muted-foreground/60 group-hover:text-primary transition-all duration-500 ease-out mr-2">
                <p className="text-lg font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out mr-2">
                  View {legislator.name}
                </p>
              </span>

              {/* Arrow with smoother animation */}
              <ArrowRight className="w-5 h-5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 ease-out" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default LegislatorCard;
