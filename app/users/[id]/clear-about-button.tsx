"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** For moderators. It clears the text only, and the action is recorded. */
export function ClearAboutButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const clear = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("That didn't work. Please try again.");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" disabled={saving} onClick={clear} data-testid="profile-clear-about">
      Remove this text
    </Button>
  );
}
