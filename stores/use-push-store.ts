"use client";

// Whether this browser gets notifications, shared by every button that offers them, so turning them on in
// one place shows everywhere at once.
import { create } from "zustand";

/**
 * - `unknown`: not checked yet (the first render, before the browser is asked)
 * - `unsupported`: this browser can't do push at all
 * - `install`: an iPhone or iPad, which allows push only once the site is on the home screen
 * - `blocked`: they said no, which only the browser's own settings can undo
 * - `off`: they can turn it on
 * - `on`: this browser is signed up
 */
export type PushStatus = "unknown" | "unsupported" | "install" | "blocked" | "off" | "on";

type PushStore = {
  status: PushStatus;
  busy: boolean;
  check: () => Promise<void>;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
};

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function supported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(PUBLIC_KEY);
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export const usePushStore = create<PushStore>((set, get) => ({
  status: "unknown",
  busy: false,

  check: async () => {
    if (typeof window === "undefined") return;
    if (!supported()) {
      set({ status: isAppleMobile() && !isStandalone() ? "install" : "unsupported" });
      return;
    }
    if (Notification.permission === "denied") {
      set({ status: "blocked" });
      return;
    }
    const existing = await navigator.serviceWorker.getRegistration("/");
    const subscription = existing ? await existing.pushManager.getSubscription() : null;
    set({ status: subscription && Notification.permission === "granted" ? "on" : "off" });
  },

  /** Asks the browser, then signs this browser up. Must be called from a tap, or browsers refuse to ask. */
  enable: async () => {
    if (get().busy) return false;
    if (!supported()) {
      await get().check();
      return false;
    }
    set({ busy: true });
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        set({ status: permission === "denied" ? "blocked" : "off" });
        return false;
      }
      const worker = await registration();
      await navigator.serviceWorker.ready;
      const subscription =
        (await worker.pushManager.getSubscription()) ??
        (await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
      const response = await fetch("/api/notifications/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("save failed");
      set({ status: "on" });
      return true;
    } finally {
      set({ busy: false });
    }
  },

  disable: async () => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const existing = await navigator.serviceWorker.getRegistration("/");
      const subscription = existing ? await existing.pushManager.getSubscription() : null;
      if (subscription) {
        await fetch("/api/notifications/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      set({ status: "off" });
    } finally {
      set({ busy: false });
    }
  },
}));
