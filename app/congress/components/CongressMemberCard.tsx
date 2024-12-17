import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Archive, Building2, MapPin, Scroll } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CongressMemberCardProps = {
  member: {
    bioguideId: string;
    name: string;
    firstName: string;
    lastName: string;
    party: string;
    role: string;
    state: string;
    terms: Array<{
      chamber: string;
      startYear: string;
    }>;
    leadership: Array<{
      type: string;
    }>;
    depiction?: {
      imageUrl: string;
    };
    sponsoredLegislationCount: number;
    cosponsoredLegislationCount: number;
  };
};

export function CongressMemberCard({ member }: CongressMemberCardProps) {
  return (
    <Link
      href={`/congress/congress-members/${member.bioguideId}`}
      className="block transition-opacity hover:opacity-80"
    >
      <Card className="flex flex-col">
        <CardHeader className="flex-row gap-4 items-start">
          <Avatar className="w-16 h-16">
            {member.depiction ? (
              <AvatarImage src={member.depiction.imageUrl} alt={member.name} />
            ) : null}
            <AvatarFallback>
              {member.firstName[0]}
              {member.lastName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {member.firstName} {member.lastName}
              </CardTitle>
              <Badge
                variant={
                  member.party === "Republican"
                    ? "destructive"
                    : member.party === "Democrat"
                    ? "default"
                    : "secondary"
                }
              >
                {member.party}
              </Badge>
            </div>
            <CardDescription>{member.role}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{member.state}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{member.terms[member.terms.length - 1]?.chamber}</span>
            </div>

            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-muted-foreground" />
              <span>Since {member.terms[0]?.startYear}</span>
            </div>

            {member.leadership.length > 0 && (
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-muted-foreground" />
                <span>{member.leadership[0].type}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div>Sponsored: {member.sponsoredLegislationCount}</div>
          <div>Co-sponsored: {member.cosponsoredLegislationCount}</div>
        </CardFooter>
      </Card>
    </Link>
  );
}
