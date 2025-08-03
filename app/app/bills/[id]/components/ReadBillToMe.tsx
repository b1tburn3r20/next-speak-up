"use client";
import { Button } from "@/components/ui/button";
import { PlayIcon, StopIcon } from "@radix-ui/react-icons";
import { Loader2, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useBillPageStore } from "../useBillPageStore";
import { toast } from "sonner";
import { useUserStore } from "@/app/app/admin/stores/useUserStore";
import TTSVoiceSelector from "./helpers/TTSVoiceSelector";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

const ReadBillToMe = () => {
  const ttsVoicePreferance = useBillPageStore((f) => f.ttsVoicePreferance);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Zustand store actions and state
  const ttsIsPlaying = useBillPageStore((state) => state.ttsIsPlaying);
  const setTtsIsPlaying = useBillPageStore((state) => state.setTtsIsPlaying);
  const billText = useBillPageStore((f) => f.currentAiSummaryText);

  const setTtsWordTimestamps = useBillPageStore(
    (state) => state.setTtsWordTimestamps
  );
  const activeUserRole = useUserStore((f) => f.activeUserRole);
  const setTtsCurrentWordIndex = useBillPageStore(
    (state) => state.setTtsCurrentWordIndex
  );
  const resetTtsState = useBillPageStore((state) => state.resetTtsState);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleAudioEnded);
      audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current = null;
    }
  };

  const fullCleanupAudio = () => {
    cleanupAudio();

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const handlePlayClick = async () => {
    if (ttsIsPlaying) {
      // Pause - keep audio element alive
      audioRef.current?.pause();
      setTtsIsPlaying(false);
    } else {
      if (audioRef.current) {
        // Resume existing paused audio
        audioRef.current.play();
        setTtsIsPlaying(true);
      } else if (audioUrlRef.current) {
        // We have cached audio - create new audio element and play
        audioRef.current = new Audio(audioUrlRef.current);
        audioRef.current.addEventListener("ended", handleAudioEnded);
        audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.play();
        setTtsIsPlaying(true);
      } else {
        // Generate new TTS
        await generateTTS();
      }
    }
  };

  const handleStopClick = () => {
    // Clean up current audio element but keep the cached audio URL
    cleanupAudio();

    // Reset playback state but keep word timestamps
    setTtsIsPlaying(false);
    setTtsCurrentWordIndex(-1);
  };

  const handleAudioEnded = () => {
    console.log("🎵 Audio playback ended");
    cleanupAudio();
    setTtsIsPlaying(false);
    setTtsCurrentWordIndex(-1);
  };

  const generateTTS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bills/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: billText,
          voice: ttsVoicePreferance,
          response_format: "mp3",
          speed: 1.0,
          word_timestamps: true,
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const rateLimitData = await response.json();

        toast.error("Rate limit exceeded. Try again in a bit!", {
          duration: 6000,
          description:
            "TTS Usage limit reached. Sorry but this stuff aint free!",
        });

        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech");
      }

      const data = await response.json();

      if (data.word_timestamps) {
        setTtsWordTimestamps(data.word_timestamps);
      }

      // Create audio element from the returned audio data
      if (data.audio) {
        // Audio is base64 encoded string
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        audioRef.current = new Audio(audioUrl);
        audioRef.current.addEventListener("ended", handleAudioEnded);
        audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

        await audioRef.current.play();
        setTtsIsPlaying(true);
        setTtsCurrentWordIndex(-1); // Reset to start
      }
    } catch (err) {
      console.error("TTS generation failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate speech";
      setError(errorMessage);

      // Show error toast
      toast.error("Speech generation failed", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (
      audioRef.current &&
      useBillPageStore.getState().ttsWordTimestamps.length > 0
    ) {
      const currentTime = audioRef.current.currentTime;
      const wordTimestamps = useBillPageStore.getState().ttsWordTimestamps;
      const currentWordIndex = wordTimestamps.findIndex(
        (word) => currentTime >= word.start && currentTime <= word.end
      );
      if (currentWordIndex !== -1) {
        setTtsCurrentWordIndex(currentWordIndex);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fullCleanupAudio();
    };
  }, [ttsVoicePreferance, billText]);

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex gap-2">
      <TTSVoiceSelector />
      {ttsIsPlaying ? (
        <div className="m-0 flex shrink-0">
          <Button onClick={handlePlayClick} className="rounded-r-none">
            <Pause />
          </Button>
          <Button onClick={handleStopClick} className="rounded-l-none">
            <StopIcon />
          </Button>
        </div>
      ) : (
        <Button className="shrink-0" onClick={handlePlayClick} size="icon">
          {isLoading ? <Loader2 className="animate-spin" /> : <PlayIcon />}
        </Button>
      )}
    </div>
  );
};

export default ReadBillToMe;
