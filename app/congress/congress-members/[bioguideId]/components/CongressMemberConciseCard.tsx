"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/utils/member-utils";
import { Separator } from "@/components/ui/separator";
import { Heart, Globe, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MissingInfoAlert from "./MissingInformationAlert";

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
    depiction?: {
      imageUrl?: string;
    } | null;
    website?: string | null;
    contact?: string | null;
    missingContactInfo?: boolean | null;
  };
}

const calculateReelectionYear = (
  chamber: string,
  startYear: number
): number => {
  const currentYear = new Date().getFullYear();
  const termLength = chamber === "Senate" ? 6 : 2;
  const elapsedTerms = Math.floor((currentYear - startYear) / termLength);
  const lastElectionYear = startYear + elapsedTerms * termLength;
  return lastElectionYear + termLength;
};

const calculateYearsInOffice = (startYear: number): number => {
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
};

export const CongressMemberConciseCard: React.FC<
  CongressMemberConciseCardProps
> = ({ member }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const age = calculateAge(member.birthYear);
  const latestTerm = member.terms[member.terms.length - 1];
  const firstTerm = member.terms[0];
  const isSenator = latestTerm.chamber === "Senate";
  const chamberLabel = isSenator ? "Senator" : "Representative";
  const reelectionYear = calculateReelectionYear(
    latestTerm.chamber,
    latestTerm.startYear
  );
  const currentTerm =
    Math.floor((2024 - latestTerm.startYear) / (isSenator ? 6 : 2)) + 1;
  const yearsInOffice = calculateYearsInOffice(firstTerm.startYear);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(
          `/api/congress/congress-members/favorite?memberId=${member.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavoriteStatus();
  }, [member.id]);

  const toggleFavorite = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/congress/congress-members/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId: member.id }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Avatar className="h-16 w-16">
          {member.depiction?.imageUrl ? (
            <AvatarImage
              src={member.depiction.imageUrl}
              alt={`${member.name} profile`}
            />
          ) : null}
          <AvatarFallback>
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>
                {member.firstName} {member.lastName}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium">{member.state}</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium">{chamberLabel}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              disabled={isLoading}
              className="ml-2"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
                }`}
              />
            </Button>
          </div>
          <div className="flex items-center mt-1">
            <Badge variant="neutral">{member.party}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Separator className="mb-3" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="font-semibold">{age}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Term</p>
            <p className="font-semibold">{currentTerm}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Years in Office</p>
            <p className="font-semibold">{yearsInOffice}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Re-election</p>
            <p className="font-semibold">Nov {reelectionYear}</p>
          </div>
        </div>

        {(member.website || member.contact) && (
          <div className="flex gap-2 mt-2">
            {member.website && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            {member.contact && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a
                  href={member.contact}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </a>
              </Button>
            )}
          </div>
        )}

        {member.missingContactInfo && (
          <MissingInfoAlert
            firstName={member.firstName}
            lastName={member.lastName}
            hasWebsite={!!member.website}
            hasContact={!!member.contact}
            missingContactInfo={member.missingContactInfo}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CongressMemberConciseCard;
