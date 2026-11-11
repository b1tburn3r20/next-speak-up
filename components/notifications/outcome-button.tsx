"use client";

import { useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { pushStatusText } from "@/components/notifications/push-settings";
import { Button } from "@/components/ui/button";
import { useCivicStore } from "@/stores/use-civic-store";
import { usePushStore } from "@/stores/use-push-store";

/**
 * "Tell me how it turns out": follows the bill and turns on notifications, so a vote on it in either
 * chamber, and its becoming law, reach them, with how their own legislators voted.
 */
export function OutcomeButton({ slug, signedIn, initialFollowing }: { slug: string; signedIn: boolean; initialFollowing: boolean }) {
  const stored = useCivicStore((state) => state.follows[slug]);
  const setFollow = useCivicStore((state) => state.setFollow);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const status = usePushStore((store) => store.status);
  const check = usePushStore((store) => store.check);
  const enable = usePushStore((store) => store.enable);
  const [saving, setSaving] = useState(false);
  const following = stored !== undefined ? stored : initialFollowing;
  const on = following && status === "on";

  useEffect(() => {
    void check();
  }, [check]);

  const ask = async () => {
    if (!signedIn) return openLogin(true);
    setSaving(true);
    try {
      if (!following && !(await setFollow(slug, true))) throw new Error("That didn't save. Please try again.");
      if (status !== "on" && !(await enable())) {
        const next = usePushStore.getState().status;
        toast(next === "off" ? "You're following it. Turn on notifications to hear how it turns out." : pushStatusText(next));
        return;
      }
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteResults: true }),
      });
      toast.success("We'll tell you when it's voted on, and if it becomes law.");
    } catch (failure) {
      toast.error((failure as Error).message || "That didn't work. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button variant={on ? "outline" : "secondary"} onClick={on ? undefined : ask} disabled={saving} aria-pressed={on} data-testid="outcome-button">
      {on ? <Check className="size-4" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
      {saving ? "Setting up…" : on ? "We'll tell you how it turns out" : "Tell me how it turns out"}
    </Button>
  );
}
