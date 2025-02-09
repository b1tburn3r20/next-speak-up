"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { type CongressMember } from "@/lib/services/congress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DistrictFinder } from "./DistrictFinder";

export function InitializeFavoritesStep() {
  const { data: session } = useSession();
  const [representatives, setRepresentatives] = useState<CongressMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtInfo, setDistrictInfo] = useState<{
    state: string;
    district: string;
  } | null>(null);

  const fetchRepresentatives = async (stateCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/congress/congress-members/by-state/${stateCode}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch representatives");
      }

      const data = await response.json();
      setRepresentatives(data);
    } catch (err) {
      console.error("Error fetching representatives:", err);
      setError("Failed to load your representatives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.state) {
      fetchRepresentatives(session.user.state);
    }
  }, [session?.user?.state]);

  const handleDistrictFound = async (data: {
    state: string;
    district: string;
  }) => {
    setDistrictInfo(data);
    await fetchRepresentatives(data.state);
  };

  const senators = representatives.filter((member) =>
    member.terms.some((term) => term.chamber === "Senate")
  );

  const districtRepresentative = districtInfo
    ? representatives.find((member) => {
        if (
          !member.terms.some(
            (term) => term.chamber === "House of Representatives"
          )
        ) {
          return false;
        }
        const districtMatch = member.role.match(/District (\d+)/);
        return districtMatch && districtMatch[1] === districtInfo.district;
      })
    : null;

  const MemberCard = ({ member }: { member: CongressMember }) => (
    <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border">
      <div className="flex-shrink-0 w-20 h-20 relative">
        {member.depiction && (
          <img
            src={member.depiction.imageUrl}
            alt={member.name}
            className="rounded-md object-cover w-full h-full"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.name}</p>
        <p
          className={cn(
            "text-sm",
            member.party === "Democratic"
              ? "text-blue-500"
              : member.party === "Republican"
              ? "text-red-500"
              : "text-muted-foreground"
          )}
        >
          {member.party}
        </p>
        <p className="text-sm text-muted-foreground">{member.role}</p>
      </div>
    </div>
  );

  if (!districtInfo) {
    return <DistrictFinder onDistrictFound={handleDistrictFound} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">
            Your Representatives in Congress 🗳️
          </h3>
          <p className="text-sm text-muted-foreground">
            Showing representatives for {districtInfo.state}'s{" "}
            {districtInfo.district} Congressional District
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Loading your representatives...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">U.S. Senate</h4>
              <div className="space-y-4">
                {senators.map((senator) => (
                  <MemberCard key={senator.id} member={senator} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">Your House Representative</h4>
              <div className="space-y-4">
                {districtRepresentative && (
                  <MemberCard member={districtRepresentative} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
