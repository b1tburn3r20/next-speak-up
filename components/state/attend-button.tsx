"use client";

import { useState } from "react";
import { Check, Hand } from "lucide-react";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";
import { useCivicStore } from "@/stores/use-civic-store";

/** "I went". We can't check this, so it says it's your word, and it only pays once per meeting. */
export function AttendButton({
  eventId,
  signedIn,
  initialReported,
}: {
  eventId: number;
  signedIn: boolean;
  initialReported: boolean;
}) {
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const setProgress = useCivicStore((state) => state.setProgress);
  const [reported, setReported] = useState(initialReported);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (reported) {
    return (
      <p className="flex items-center gap-1.5 font-extrabold text-support" data-testid="attend-done">
        <Check className="size-5" aria-hidden />
        You said you went. Thanks for showing up.
      </p>
    );
  }

  const report = async () => {
    if (!signedIn) return openLogin(true);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/civic/events/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "That didn't save. Please try again.");
      setReported(true);
      // The XP bar should move right away. If this fails, it catches up on the next page.
      const progress = await fetch("/api/civic/progress").catch(() => null);
      if (progress?.ok) setProgress((await progress.json()).progress);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button disabled={saving} onClick={report} data-testid="attend-button">
        <Hand className="size-4" aria-hidden />
        {saving ? "Saving…" : "I went"}
      </Button>
      <p className="text-xs text-muted-foreground">Self-reported, so it&apos;s on your word. Worth 50 XP, once.</p>
      {error ? <p role="alert" className="text-sm font-bold text-oppose">{error}</p> : null}
    </div>
  );
}
