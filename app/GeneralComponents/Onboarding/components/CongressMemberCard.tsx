import { useState, useEffect } from "react";
import { type CongressMember } from "@/lib/services/congress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useOnboardingStore } from "../useOnboardingStore";

interface CongressMemberCardProps {
  member: CongressMember;
  className?: string;
}

export function CongressMemberCard({
  member,
  className,
}: CongressMemberCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const favoriteCount = useOnboardingStore((state) => state.favoriteCount);

  // Get initials from the member's name
  const getInitials = (name: string) => {
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${
        nameParts[nameParts.length - 1][0]
      }`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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
  }, [member.id, favoriteCount]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div
      className={`flex items-center space-x-3 p-2 bg-card rounded-full border ${
        className || ""
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12">
        <Avatar className="w-full h-full">
          <AvatarImage
            src={member.depiction?.imageUrl}
            alt={member.name}
            className="object-cover"
          />
          <AvatarFallback className="text-sm">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{member.name}</p>
        <div className="flex items-center space-x-2">
          <p className="text-xs">{member.party}</p>
          <span className="text-xs text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground truncate">
            {member.role}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFavorite}
        disabled={isLoading}
        className="flex-shrink-0"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
          }`}
        />
      </Button>
    </div>
  );
}
