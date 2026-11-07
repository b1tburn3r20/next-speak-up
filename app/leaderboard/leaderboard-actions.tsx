"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

async function send(method: "PATCH" | "DELETE", body: unknown) {
  const response = await fetch("/api/civic/leaderboard", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("That didn't work. Please try again.");
}

export function LeaderboardToggle({ joined }: { joined: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const toggle = async () => {
    setSaving(true);
    try {
      await send("PATCH", { optIn: !joined });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Button variant={joined ? "secondary" : "default"} disabled={saving} onClick={toggle} data-testid="leaderboard-toggle">
      {joined ? "Leave the leaderboard" : "Join the leaderboard"}
    </Button>
  );
}

export function RemoveFromBoard({ userId, username }: { userId: string; username: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const remove = async () => {
    setSaving(true);
    try {
      await send("DELETE", { userId });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" disabled={saving} onClick={remove} aria-label={`Remove ${username} from the leaderboard`} data-testid="leaderboard-remove">
      Remove
    </Button>
  );
}
