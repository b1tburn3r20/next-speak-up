"use client";

import { memo, useState } from "react";
import { Bell, BellRing, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";
import { useCivicStore, type Choice } from "@/stores/use-civic-store";

function asChoice(value: string | null | undefined): Choice | null {
  return value === "YEA" || value === "NAY" ? value : null;
}

/**
 * Support, Oppose, and Follow for one bill. It reads only this bill's state from the store, so a
 * vote elsewhere doesn't re-render it. The initial values come from the server's first paint.
 */
export const BillActionButtons = memo(function BillActionButtons({
  slug,
  signedIn,
  initialPosition,
  initialFollowing,
  showFollow = true,
  size = "default",
}: {
  slug: string;
  signedIn: boolean;
  initialPosition: string | null;
  initialFollowing: boolean;
  showFollow?: boolean;
  size?: "default" | "lg";
}) {
  const storedVote = useCivicStore((state) => state.votes[slug]);
  const storedFollow = useCivicStore((state) => state.follows[slug]);
  const castVote = useCivicStore((state) => state.castVote);
  const setFollow = useCivicStore((state) => state.setFollow);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const [saving, setSaving] = useState(false);

  const position = storedVote !== undefined ? storedVote : asChoice(initialPosition);
  const following = storedFollow !== undefined ? storedFollow : initialFollowing;

  const vote = async (choice: Choice) => {
    if (!signedIn) return openLogin(true);
    setSaving(true);
    try {
      await castVote(slug, position === choice ? null : choice, position);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const follow = async () => {
    if (!signedIn) return openLogin(true);
    try {
      await setFollow(slug, !following);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={position === "YEA" ? "support" : "outline"}
        size={size}
        aria-pressed={position === "YEA"}
        disabled={saving}
        onClick={() => vote("YEA")}
        data-testid="vote-support"
        className="flex-1 sm:flex-none"
      >
        <ThumbsUp className="size-4" aria-hidden /> Support
      </Button>
      <Button
        variant={position === "NAY" ? "oppose" : "outline"}
        size={size}
        aria-pressed={position === "NAY"}
        disabled={saving}
        onClick={() => vote("NAY")}
        data-testid="vote-oppose"
        className="flex-1 sm:flex-none"
      >
        <ThumbsDown className="size-4" aria-hidden /> Oppose
      </Button>
      {showFollow ? (
        <Button
          variant="ghost"
          aria-pressed={following}
          onClick={follow}
          data-testid="follow-bill"
        >
          {following ? <BellRing className="size-4 text-primary" aria-hidden /> : <Bell className="size-4" aria-hidden />}
          {following ? "Following" : "Follow"}
        </Button>
      ) : null}
    </div>
  );
});
