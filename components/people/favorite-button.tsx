"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";
import { useCivicStore } from "@/stores/use-civic-store";

export function FavoriteButton({
  bioguideId,
  signedIn,
  initialFavorite,
}: {
  bioguideId: string;
  signedIn: boolean;
  initialFavorite: boolean;
}) {
  const stored = useCivicStore((state) => state.favorites[bioguideId]);
  const setFavorite = useCivicStore((state) => state.setFavorite);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const favorite = stored !== undefined ? stored : initialFavorite;

  const toggle = async () => {
    if (!signedIn) return openLogin(true);
    try {
      await setFavorite(bioguideId, !favorite);
    } catch {
      toast.error("That didn't save. Please try again.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-pressed={favorite}
      data-testid="favorite-member"
    >
      <Star className={`size-4 ${favorite ? "fill-current text-streak" : ""}`} aria-hidden />
      {favorite ? "Saved" : "Save member"}
    </Button>
  );
}
