"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";

/** Reads the summary aloud. Audio is only requested on a click, because each request costs money. */
export function BillListenButton({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);

  useEffect(
    () => () => {
      audio.current?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );

  const toggle = async () => {
    if (!signedIn) return openLogin(true);
    if (audio.current) {
      if (playing) {
        audio.current.pause();
        setPlaying(false);
      } else {
        await audio.current.play();
        setPlaying(true);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/civic/bills/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "We couldn't read this. Please try again.");
      }
      audioUrl.current = URL.createObjectURL(await response.blob());
      audio.current = new Audio(audioUrl.current);
      audio.current.addEventListener("ended", () => setPlaying(false));
      await audio.current.play();
      setPlaying(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't read this.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      data-testid="bill-listen"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : playing ? (
        <Pause className="size-4" aria-hidden />
      ) : (
        <Play className="size-4" aria-hidden />
      )}
      {playing ? "Pause" : "Listen to summary"}
    </Button>
  );
}
