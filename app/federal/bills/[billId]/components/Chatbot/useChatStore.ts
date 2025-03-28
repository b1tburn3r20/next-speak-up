// useChatStore.ts
import { create } from "zustand";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  shouldAnimate: boolean;
  hasAnimated: boolean;
};

type ChatSettings = {
  longResponses: boolean;
  advancedLanguage: boolean;
  contextSize: number;
};

type ChatState = {
  messages: Message[];
  isTyping: boolean;
  isMinimized: boolean;
  settings: ChatSettings;
  addMessage: (
    content: string,
    role: "user" | "assistant",
    shouldAnimate?: boolean
  ) => void;
  setMessageAnimated: (messageId: string) => void;
  setTyping: (typing: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  clearChat: () => void;
  hasInitialized: boolean;
  setInitialized: () => void;
  getContextMessages: () => Message[];
};

const initialState = {
  messages: [],
  isTyping: false,
  isMinimized: false,
  hasInitialized: false,
  settings: {
    longResponses: false,
    advancedLanguage: false,
    contextSize: 30,
  },
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,
  addMessage: (content, role, shouldAnimate = false) =>
    set((state) => ({
      messages: [
        ...state.messages.map((msg) => ({
          ...msg,
          shouldAnimate: false, // Ensure only newest message animates
        })),
        {
          id: crypto.randomUUID(),
          content,
          role,
          timestamp: new Date(),
          shouldAnimate,
          hasAnimated: false,
        },
      ].slice(-state.settings.contextSize),
    })),
  setMessageAnimated: (messageId: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, shouldAnimate: false, hasAnimated: true }
          : msg
      ),
    })),
  setTyping: (typing) => set({ isTyping: typing }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  setInitialized: () => set({ hasInitialized: true }),
  clearChat: () => set(initialState),
  getContextMessages: () => {
    const state = get();
    return state.messages.slice(-state.settings.contextSize);
  },
}));
