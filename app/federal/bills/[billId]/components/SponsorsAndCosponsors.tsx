import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users2Icon } from "lucide-react";
import { CongressMemberAvatar } from "./CongressMemberAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";

type Sponsor = {
  sponsor: {
    bioguideId: string;
    name: string;
    state: string;
    party: string;
    depiction?: {
      imageUrl: string;
    };
  };
};

type Cosponsor = {
  cosponsor: {
    bioguideId: string;
    name: string;
    state: string;
    party: string;
    depiction?: {
      imageUrl: string;
    };
  };
};

type SponsorsAndCosponsorsProps = {
  sponsors: Sponsor[];
  cosponsors: Cosponsor[];
};

export const SponsorsAndCosponsors = ({
  sponsors,
  cosponsors,
}: SponsorsAndCosponsorsProps) => (
  <Card className="shadow-md">
    <CardHeader className="">
      <CardTitle className="flex items-center text-lg font-semibold">
        <span>Sponsor / Introduced By</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="">
      <div className="space-y-1">
        {sponsors.map(({ sponsor }) => (
          <div
            key={sponsor.bioguideId}
            className="transition-all duration-200 hover:scale-[1.02]"
          >
            <CongressMemberAvatar member={sponsor} />
          </div>
        ))}
      </div>

      {cosponsors.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="flex items-center space-x-2 mb-4">
            <Users2Icon className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold">
              Cosponsors ({cosponsors.length})
            </h3>
          </div>
          <ScrollArea className="h-[300px] pr-4 rounded-lg">
            <div className="space-y-3">
              {cosponsors.map(({ cosponsor }) => (
                <div
                  key={cosponsor.bioguideId}
                  className="transition-all duration-200 hover:scale-[1.02]"
                >
                  <CongressMemberAvatar member={cosponsor} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </CardContent>
  </Card>
);
