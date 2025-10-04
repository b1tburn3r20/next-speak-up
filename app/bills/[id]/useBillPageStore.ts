import { create } from "zustand";
import { FullUserLegislationData } from "@/lib/types/bill-types";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export type BillPageStore = {
  billData: FullUserLegislationData | null;
  isDyslexicFriendly: boolean;
  currentAiSummary: string | null;
  currentOfficialSummary: string | null;
  currentAiSummaryText: string | null;

  // TTS state
  ttsIsPlaying: boolean;
  ttsWordTimestamps: WordTimestamp[];
  ttsCurrentWordIndex: number;
  ttsVoicePreferance: string;

  // Actions
  setTTSVoicePreferance: (data: string) => void;
  setCurrentAISummaryText: (data: string) => void;
  setBillData: (data: FullUserLegislationData) => void;
  setIsDyslexicFriendly: (data: boolean) => void;
  setCurrentAiSummary: (date: string | null) => void;
  setCurrentOfficialSummary: (date: string | null) => void;
  resetBillState: () => void;

  // TTS actions
  setTtsIsPlaying: (isPlaying: boolean) => void;
  setTtsWordTimestamps: (timestamps: WordTimestamp[]) => void;
  setTtsCurrentWordIndex: (index: number) => void;
  resetTtsState: () => void;
};

const initialData = {
  billData: null,
  isDyslexicFriendly: false,
  currentAiSummary: null,
  currentOfficialSummary: null,
  currentAiSummaryText: "",

  // TTS initial state
  ttsIsPlaying: false,
  ttsWordTimestamps: [],
  ttsCurrentWordIndex: -1,
  ttsVoicePreferance: "heart",
};

export const useBillPageStore = create<BillPageStore>((set) => ({
  ...initialData,

  setCurrentAISummaryText: (data: string) =>
    set({ currentAiSummaryText: data }),
  setBillData: (data: FullUserLegislationData | null) =>
    set({
      currentAiSummary: null,
      currentAiSummaryText: null,
      currentOfficialSummary: null,
      // You might also want to reset TTS state when switching bills
      ttsIsPlaying: false,
      ttsWordTimestamps: [],
      ttsCurrentWordIndex: -1,
      billData: data,
    }),
  setIsDyslexicFriendly: (data: boolean) => set({ isDyslexicFriendly: data }),
  setCurrentAiSummary: (date: string | null) => set({ currentAiSummary: date }),
  setCurrentOfficialSummary: (date: string | null) =>
    set({ currentOfficialSummary: date }),
  resetBillState: () =>
    set({
      billData: null,
      currentAiSummary: null,
      currentOfficialSummary: null,
      currentAiSummaryText: "",
    }),
  // TTS actions
  setTTSVoicePreferance: (data: string) => set({ ttsVoicePreferance: data }),
  setTtsIsPlaying: (isPlaying: boolean) => set({ ttsIsPlaying: isPlaying }),
  setTtsWordTimestamps: (timestamps: WordTimestamp[]) =>
    set({ ttsWordTimestamps: timestamps }),
  setTtsCurrentWordIndex: (index: number) =>
    set({ ttsCurrentWordIndex: index }),
  resetTtsState: () =>
    set({
      ttsIsPlaying: false,
      ttsWordTimestamps: [],
      ttsCurrentWordIndex: -1,
    }),
}));
