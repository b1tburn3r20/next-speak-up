// Whether Coolbills can be added to this phone's home screen, and how. Shared by the one-time prompt
// and the More sheet's Install tile, so they always agree.
//
// - Android (Chrome, Edge, Samsung): the browser fires `beforeinstallprompt`, and its event shows the
//   real install dialog. The root layout catches it early, before React loads, on `window`.
// - iPhone and iPad: Safari has no install dialog, so we show how: Share, then Add to Home Screen.
// - Android without the event (Chrome won't offer it again for a while after "Not now"): we show
//   the browser menu's own Install app item instead.
// - Already installed, or opened from the home screen: nothing to offer.
import { create } from "zustand";

/** The browser's install event. Not in TypeScript's DOM types yet. */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    /** Set by the layout's early script, if the browser offered to install before React loaded. */
    __coolbillsInstall?: InstallPromptEvent;
  }
}

export type InstallWay = "unknown" | "dialog" | "ios" | "manual" | "installed";

// Remembered on this device: once asked, the prompt doesn't come back. The More sheet still offers it.
const ASKED_KEY = "pwa.installAsked";

function readAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === "true";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

type InstallStore = {
  way: InstallWay;
  asked: boolean;
  /** The iPhone steps, open. */
  showingSteps: boolean;
  deferred: InstallPromptEvent | null;
  start: () => void;
  /** Marks the prompt as answered on this device, either way. */
  markAsked: () => void;
  /** Opens the real install dialog, or the iPhone steps. Resolves to whether it was installed. */
  install: () => Promise<boolean>;
  setShowingSteps: (open: boolean) => void;
};

let started = false;

export const useInstallStore = create<InstallStore>((set, get) => ({
  way: "unknown",
  asked: false,
  showingSteps: false,
  deferred: null,

  start: () => {
    if (started || typeof window === "undefined") return;
    started = true;
    const asked = readAsked();
    if (isStandalone()) {
      set({ way: "installed", asked });
      return;
    }
    const offer = (event: InstallPromptEvent) => set({ way: "dialog", deferred: event });
    if (window.__coolbillsInstall) offer(window.__coolbillsInstall);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      offer(event as InstallPromptEvent);
    });
    window.addEventListener("appinstalled", () => set({ way: "installed", deferred: null }));
    if (get().way === "unknown") set({ way: isAppleMobile() ? "ios" : "manual" });
    set({ asked });
  },

  markAsked: () => {
    try {
      localStorage.setItem(ASKED_KEY, "true");
    } catch {
      // Not remembered, so it may ask again next visit. The More sheet works either way.
    }
    set({ asked: true });
  },

  install: async () => {
    const { way, deferred } = get();
    if (way === "ios" || way === "manual") {
      set({ showingSteps: true });
      return false;
    }
    if (way !== "dialog" || !deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // An install event can only be used once. The browser offers a new one if it can.
    window.__coolbillsInstall = undefined;
    if (outcome === "accepted") {
      set({ way: "installed", deferred: null });
      return true;
    }
    set({ deferred: null, way: "manual" });
    return false;
  },

  setShowingSteps: (open) => set({ showingSteps: open }),
}));
