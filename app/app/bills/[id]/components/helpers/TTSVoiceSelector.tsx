"use client";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/app/app/admin/stores/useUserStore";

import { TTSVoiceOptions } from "@/app/data/TTSVoiceOptions";
import { useBillPageStore } from "../../useBillPageStore";

const TTSVoiceSelector = () => {
  const userRole = useUserStore((f) => f.activeUserRole);

  const isDisabled = !userRole || userRole === "Member";

  const setTTSVoicePreferance = useBillPageStore(
    (f) => f.setTTSVoicePreferance
  );
  const ttsVoicePreferance = useBillPageStore((f) => f.ttsVoicePreferance);
  const setTtsCurrentWordIndex = useBillPageStore(
    (f) => f.setTtsCurrentWordIndex
  );
  const setTtsIsPlaying = useBillPageStore((f) => f.setTtsIsPlaying);
  const postSetTTSVoicePreferance = async (voice: string) => {
    try {
      const response = await fetch("/api/user/tts-voice-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voice }),
      });

      if (!response.ok) {
        throw new Error("Failed to set TTS voice preference");
      }

      // Update local state after successful API call
    } catch (error) {
      console.error("Error setting TTS voice preference:", error);
      // Optionally show error toast/notification here
    }
  };

  const handleVoiceChange = (voice: string) => {
    // Reset playback state but keep word timestamps
    setTtsIsPlaying(false);
    setTtsCurrentWordIndex(-1);
    setTTSVoicePreferance(voice);
    postSetTTSVoicePreferance(voice);
  };

  return (
    <Select
      value={ttsVoicePreferance || "heart"}
      onValueChange={handleVoiceChange}
    >
      <SelectTrigger disabled={isDisabled} className="capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TTSVoiceOptions.map((f, i) => (
          <SelectItem className="capitalize" value={f} key={i}>
            {f}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TTSVoiceSelector;
