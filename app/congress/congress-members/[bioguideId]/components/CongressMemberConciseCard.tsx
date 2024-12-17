import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/utils/member-utils";
import { Separator } from "@/components/ui/separator";

interface CongressMemberConciseCardProps {
  member: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    birthYear: string;
    party: string;
    role: string;
    state: string;
    terms: {
      chamber: string;
      startYear: number;
      endYear: number | null;
    }[];
    depiction: {
      imageUrl: string;
    };
  };
}

const calculateSenateReelection = (startYear: number): number => {
  return startYear + 6;
};

export const CongressMemberConciseCard: React.FC<
  CongressMemberConciseCardProps
> = ({ member }) => {
  const age = calculateAge(member.birthYear);
  const latestTerm = member.terms[member.terms.length - 1];
  const isSenator = latestTerm.chamber === "Senate";
  const chamberLabel = isSenator ? "Sen." : "Rep.";
  const reelectionYear = isSenator
    ? calculateSenateReelection(latestTerm.startYear)
    : latestTerm.endYear || "Unknown";

  return (
    <Card className="w-full max-w-md border-none">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={member.depiction.imageUrl}
            alt={`${member.name} profile`}
          />
          <AvatarFallback>
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="flex items-center space-x-2">
            <span>
              {member.firstName} {member.lastName}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">{chamberLabel}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">{member.state}</span>
          </CardTitle>
          <div className="flex items-center mt-1">
            <Badge
              variant={
                member.party === "Republican" ? "destructive" : "default"
              }
            >
              {member.party}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Separator className="mb-3" />
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="font-semibold">{age}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Elected</p>
            <p className="font-semibold">{latestTerm.startYear}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Re-election</p>
            <p className="font-semibold">{reelectionYear}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CongressMemberConciseCard;
