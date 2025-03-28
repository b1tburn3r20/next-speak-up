import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { type CongressMember } from "@/lib/services/congress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DistrictFinder } from "./DistrictFinder";
import { CongressMemberCard } from "./CongressMemberCard";
import { UpdateStateDialog } from "./UpdateStateDialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useOnboardingStore } from "../useOnboardingStore";

export function InitializeFavoritesStep() {
  const { data: session } = useSession();
  const [representatives, setRepresentatives] = useState<CongressMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtInfo, setDistrictInfo] = useState<{
    state: string;
    district: string;
  } | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [detectedState, setDetectedState] = useState<string>("");
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [allFavorited, setAllFavorited] = useState(false);
  const [favoritedMemberIds, setFavoritedMemberIds] = useState<Set<number>>(
    new Set()
  );
  const incrementFavoriteCount = useOnboardingStore(
    (state) => state.incrementFavoriteCount
  );

  // Store the pending district info that we'll use after state update
  const [pendingDistrictInfo, setPendingDistrictInfo] = useState<{
    state: string;
    district: string;
  } | null>(null);

  const checkAllFavoriteStatus = async (members: CongressMember[]) => {
    const statuses = await Promise.all(
      members.map(async (member) => {
        const response = await fetch(
          `/api/congress/congress-members/favorite?memberId=${member.id}`
        );
        if (response.ok) {
          const data = await response.json();
          return data.isFavorited;
        }
        return false;
      })
    );
    return statuses.every((status) => status);
  };

  const favoriteAllRepresentatives = async () => {
    setIsFavoriting(true);
    const relevantMembers = [...senators, districtRepresentative].filter(
      Boolean
    );

    try {
      const currentlyAllFavorited = await checkAllFavoriteStatus(
        relevantMembers
      );
      const favoriteAction = !currentlyAllFavorited;

      for (const member of relevantMembers) {
        await fetch("/api/congress/congress-members/favorite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId: member.id,
            favorite: favoriteAction,
          }),
        });

        setFavoritedMemberIds((prev) => {
          const newSet = new Set(prev);
          if (favoriteAction) {
            newSet.add(member.id);
          } else {
            newSet.delete(member.id);
          }
          return newSet;
        });

        incrementFavoriteCount();
      }

      setAllFavorited(favoriteAction);
    } catch (error) {
      console.error("Error favoriting representatives:", error);
    } finally {
      setIsFavoriting(false);
    }
  };

  const fetchRepresentatives = async (stateCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/congress/congress-members/by-state/${stateCode}`
      );
      if (!response.ok) throw new Error("Failed to fetch representatives");
      const data = await response.json();
      setRepresentatives(data);

      const favorites = new Set<number>();
      await Promise.all(
        data.map(async (member: CongressMember) => {
          const favoriteResponse = await fetch(
            `/api/congress/congress-members/favorite?memberId=${member.id}`
          );
          if (favoriteResponse.ok) {
            const { isFavorited } = await favoriteResponse.json();
            if (isFavorited) {
              favorites.add(member.id);
            }
          }
        })
      );
      setFavoritedMemberIds(favorites);
    } catch (err) {
      console.error("Error fetching representatives:", err);
      setError("Failed to load your representatives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.state) fetchRepresentatives(session.user.state);
  }, [session?.user?.state]);

  useEffect(() => {
    const checkFavorites = async () => {
      if (districtInfo && representatives.length > 0) {
        const relevantMembers = [...senators, districtRepresentative].filter(
          Boolean
        );
        const status = await checkAllFavoriteStatus(relevantMembers);
        setAllFavorited(status);
      }
    };

    checkFavorites();
  }, [districtInfo, representatives]);

  const handleStateUpdated = (newState: string) => {
    if (pendingDistrictInfo) {
      // After the state is updated, set the district info that was pending
      setDistrictInfo(pendingDistrictInfo);
      setPendingDistrictInfo(null);
    }
  };

  const handleDistrictFound = async (data: {
    state: string;
    district: string;
  }) => {
    if (session?.user?.state && data.state !== session.user.state) {
      // Store the district info to be set after state update
      setPendingDistrictInfo(data);
      setDetectedState(data.state);
      setShowStateDialog(true);
      return;
    }
    setDistrictInfo(data);
  };

  const senators = representatives.filter((member) =>
    member.role.toLowerCase().includes("senator")
  );

  const houseRepresentatives = representatives.filter(
    (member) => !member.role.toLowerCase().includes("senator")
  );

  const sortedHouseRepresentatives = [...houseRepresentatives].sort((a, b) => {
    // First priority: district representative
    if (districtInfo) {
      const aIsDistrict =
        parseInt(a.district || "0") === parseInt(districtInfo.district);
      const bIsDistrict =
        parseInt(b.district || "0") === parseInt(districtInfo.district);
      if (aIsDistrict !== bIsDistrict) return aIsDistrict ? -1 : 1;
    }

    // Second priority: favorited status
    const aIsFavorited = favoritedMemberIds.has(a.id);
    const bIsFavorited = favoritedMemberIds.has(b.id);
    if (aIsFavorited !== bIsFavorited) return aIsFavorited ? -1 : 1;

    // Third priority: district number
    return parseInt(a.district || "0") - parseInt(b.district || "0");
  });

  const districtRepresentative = districtInfo
    ? houseRepresentatives.find((member) => {
        const memberDistrict = parseInt(member.district || "0");
        const selectedDistrict = parseInt(districtInfo.district);
        return memberDistrict === selectedDistrict;
      })
    : null;

  if (isLoading)
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Loading...
      </p>
    );
  if (error)
    return <p className="text-center text-sm text-red-500 py-4">{error}</p>;

  const stateName = districtInfo?.state || session?.user?.state || "your state";

  return (
    <>
      <div className="w-[900px] h-[600px]">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2">U.S. Senate</h4>
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
                    {senators.map((senator) => (
                      <CongressMemberCard key={senator.id} member={senator} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2">
                  House Representatives
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {sortedHouseRepresentatives.map((rep) => (
                      <div key={rep.id} className="relative">
                        {districtInfo &&
                          parseInt(rep.district || "0") ===
                            parseInt(districtInfo.district) && (
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                          )}
                        <CongressMemberCard
                          member={rep}
                          className={
                            districtInfo &&
                            parseInt(rep.district || "0") ===
                              parseInt(districtInfo.district)
                              ? "border-primary"
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="w-[400px]">
            <Card className="h-full">
              <CardContent className="pt-4">
                <h3 className="text-sm font-medium mb-2">Your District</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Currently showing representatives for {stateName}
                  {districtInfo && ` - District ${districtInfo.district}`}
                </p>
                {!districtInfo && (
                  <div className="mt-2">
                    <DistrictFinder onDistrictFound={handleDistrictFound} />
                  </div>
                )}
                {districtInfo && districtRepresentative && (
                  <Button
                    onClick={favoriteAllRepresentatives}
                    disabled={isFavoriting}
                    variant={allFavorited ? "destructive" : "default"}
                    className="w-full mt-4"
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${
                        allFavorited ? "fill-current" : ""
                      }`}
                    />
                    {isFavoriting
                      ? "Processing..."
                      : allFavorited
                      ? "Remove All from Favorites"
                      : "Add All to Favorites"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UpdateStateDialog
        open={showStateDialog}
        onOpenChange={setShowStateDialog}
        detectedState={detectedState}
        onStateUpdated={handleStateUpdated}
      />
    </>
  );
}
