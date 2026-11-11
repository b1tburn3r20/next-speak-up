"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { saveHomeCity } from "@/components/city/home-city-button";
import { pushStatusText } from "@/components/notifications/push-settings";
import { Button } from "@/components/ui/button";
import { usePushStore } from "@/stores/use-push-store";

async function meetingsOn(): Promise<void> {
  await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cityMeetings: true }),
  });
}

/**
 * "Remind me" on a city's page: notifications a week, two days, and a day before the council meets, and
 * that morning. Reminders follow someone's home city, so for any other city it first offers to make it theirs.
 */
export function RemindMeButton({
  cityKey,
  cityName,
  livesHere,
  signedIn,
  className,
}: {
  cityKey: string;
  cityName: string;
  livesHere: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const status = usePushStore((store) => store.status);
  const busy = usePushStore((store) => store.busy);
  const check = usePushStore((store) => store.check);
  const enable = usePushStore((store) => store.enable);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void check();
  }, [check]);

  const remind = async () => {
    if (!signedIn) return openLogin(true);
    if (!livesHere && !confirming) return setConfirming(true);
    setSaving(true);
    try {
      if (!livesHere) await saveHomeCity(cityKey);
      if (status !== "on" && !(await enable())) {
        const next = usePushStore.getState().status;
        toast.error(next === "off" ? "Notifications weren't allowed, so we can't remind you." : pushStatusText(next));
        return;
      }
      await meetingsOn();
      toast.success(`We'll remind you before ${cityName}'s council meets.`);
      if (!livesHere) router.refresh();
    } catch (failure) {
      toast.error((failure as Error).message || "That didn't work. Please try again.");
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  if (livesHere && status === "on") {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-primary" data-testid="remind-me-on">
        <BellRing className="size-4" aria-hidden />
        You&apos;ll get reminders
      </p>
    );
  }
  return (
    <Button onClick={remind} disabled={saving || busy} className={className} data-testid="remind-me">
      <Bell className="size-4" aria-hidden />
      {saving || busy ? "Setting up…" : confirming ? `Make ${cityName} my city, and remind me` : "Remind me before it meets"}
    </Button>
  );
}
