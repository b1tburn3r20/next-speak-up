"use client";

import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";
import { useCivicStore } from "@/stores/use-civic-store";

export function TrackTopicButton({
  policyArea,
  signedIn,
  initialTracked,
}: {
  policyArea: string;
  signedIn: boolean;
  initialTracked: boolean;
}) {
  const stored = useCivicStore((state) => state.topics[policyArea]);
  const setTopic = useCivicStore((state) => state.setTopic);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const tracked = stored !== undefined ? stored : initialTracked;

  const toggle = async () => {
    if (!signedIn) return openLogin(true);
    try {
      await setTopic(policyArea, !tracked);
    } catch {
      toast.error("That didn't save. Please try again.");
    }
  };

  return (
    <Button
      type="button"
      variant={tracked ? "outline" : "default"}
      onClick={toggle}
      aria-pressed={tracked}
      data-testid="track-topic"
    >
      {tracked ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
      {tracked ? "Tracking" : "Track this topic"}
    </Button>
  );
}
