"use client";

import { useState } from "react";
import { Bell, BellOff, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLoginStore } from "@/app/navbar/use-login-store";

type Position = "YEA" | "NAY" | null;

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "That didn't save. Please try again.");
  }
}

export function BillActionButtons({
  slug,
  signedIn,
  initialPosition,
  initialFollowing,
}: {
  slug: string;
  signedIn: boolean;
  initialPosition: string | null;
  initialFollowing: boolean;
}) {
  const [position, setPosition] = useState<Position>(
    initialPosition === "YEA" || initialPosition === "NAY" ? initialPosition : null,
  );
  const [following, setFollowing] = useState(initialFollowing);
  const [saving, setSaving] = useState(false);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);

  const vote = async (choice: "YEA" | "NAY") => {
    if (!signedIn) return openLogin(true);
    const previous = position;
    const next = previous === choice ? null : choice;
    // Updates right away, and rolls back if the save fails.
    setPosition(next);
    setSaving(true);
    try {
      await post("/api/civic/bills/vote", { slug, position: next });
    } catch (error) {
      setPosition(previous);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const follow = async () => {
    if (!signedIn) return openLogin(true);
    const previous = following;
    setFollowing(!previous);
    try {
      await post("/api/civic/bills/follow", { slug, following: !previous });
    } catch (error) {
      setFollowing(previous);
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={position === "YEA" ? "default" : "outline"}
        aria-pressed={position === "YEA"}
        disabled={saving}
        onClick={() => vote("YEA")}
        data-testid="vote-support"
      >
        <ThumbsUp className="size-4" /> Support
      </Button>
      <Button
        variant={position === "NAY" ? "default" : "outline"}
        aria-pressed={position === "NAY"}
        disabled={saving}
        onClick={() => vote("NAY")}
        data-testid="vote-oppose"
      >
        <ThumbsDown className="size-4" /> Oppose
      </Button>
      <Button
        variant="ghost"
        aria-pressed={following}
        onClick={follow}
        data-testid="follow-bill"
      >
        {following ? <BellOff className="size-4" /> : <Bell className="size-4" />}
        {following ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
