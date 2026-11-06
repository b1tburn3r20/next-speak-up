"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** The phone's share sheet where there is one, and a copied link everywhere else. */
export function ShareButton({ title }: { title: string }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (error) {
      // Closing the share sheet counts as an error, and isn't one.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("We couldn't share that. Copy the address from your browser instead.");
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={share} data-testid="share-button">
      <Share2 className="size-4" aria-hidden />
      Share
    </Button>
  );
}
