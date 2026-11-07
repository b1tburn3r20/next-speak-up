"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCivicStore, type Choice } from "@/stores/use-civic-store";

/** Vote, or choose to read on. Either way the server then renders the whole bill page. */
export function VoteGateActions({ slug }: { slug: string }) {
  const router = useRouter();
  const castVote = useCivicStore((state) => state.castVote);
  const setJustVoted = useCivicStore((state) => state.setJustVoted);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const vote = async (choice: Choice) => {
    setSaving(true);
    try {
      await castVote(slug, choice, null);
      setJustVoted(slug);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/civic/bills/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!response.ok) throw new Error("That didn't work. Please try again.");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="support" size="lg" disabled={saving} onClick={() => vote("YEA")} data-testid="vote-support">
          <ThumbsUp className="size-4" aria-hidden /> Support
        </Button>
        <Button variant="oppose" size="lg" disabled={saving} onClick={() => vote("NAY")} data-testid="vote-oppose">
          <ThumbsDown className="size-4" aria-hidden /> Oppose
        </Button>
      </div>
      <Button
        type="button"
        variant="link"
        className="w-full font-bold text-muted-foreground underline"
        disabled={saving}
        onClick={skip}
        data-testid="gate-skip"
      >
        Just show me the bill
      </Button>
    </div>
  );
}
