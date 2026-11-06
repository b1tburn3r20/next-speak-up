"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  bioguideId,
  signedIn,
  initialFavorite,
}: {
  bioguideId: string;
  signedIn: boolean;
  initialFavorite: boolean;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [saving, setSaving] = useState(false);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);

  const toggle = async () => {
    if (!signedIn) return openLogin(true);
    const next = !favorite;
    setFavorite(next);
    setSaving(true);
    try {
      const response = await fetch("/api/civic/people/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioguideId, favorite: next }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setFavorite(!next);
      toast.error("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={saving}
      aria-pressed={favorite}
      data-testid="favorite-member"
    >
      <Star className={`size-4 ${favorite ? "fill-current" : ""}`} aria-hidden />
      {favorite ? "Saved" : "Save member"}
    </Button>
  );
}
