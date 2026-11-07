// Global client state for what the user does: votes, follows, saved members, and reveals.
//
// Rules, from docs/ui-guidelines.md:
// - Read one value with a selector, like useCivicStore((s) => s.votes[slug]). That way, voting on
//   one bill re-renders only that bill's buttons.
// - The server renders first paint from the database, and components take that as an initial
//   value. This store only holds what's changed since. It's never written during server rendering,
//   because a module-level store would be shared between users there.
import { useEffect } from "react";
import { create } from "zustand";
import { applyVote, celebrate, XP_AMOUNTS, type HudProgress } from "@/lib/civic/progress";

export type Choice = "YEA" | "NAY";

export type RepReveal = {
  personId: number;
  name: string;
  imageUrl: string | null;
  bioguide: string | null;
  party: string | null;
  role: string;
  position: "YEA" | "NAY" | "PRESENT" | "NOT_VOTING" | null;
  outcome: "MATCH" | "DIFFERENT" | "DID_NOT_VOTE" | "NO_RECORD";
  occurredAt: string | null;
};

export type RevealState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; reps: RepReveal[] };

export type Reward = {
  id: number;
  xp: number;
  message: string;
  /** Something bigger than XP, like a new level. It gets confetti. */
  celebration: string | null;
};

type CivicState = {
  votes: Record<string, Choice | null>;
  follows: Record<string, boolean>;
  favorites: Record<string, boolean>;
  /** Policy areas started or stopped since the page loaded. */
  topics: Record<string, boolean>;
  reveals: Record<string, RevealState>;
  /**
   * The one copy of streak, level, and XP. Seeded once by the server, moved right away on a vote, and
   * replaced by the server's answer. Server pages must not add votes on top of their own numbers, or
   * returning to a page counts them twice.
   */
  progress: HudProgress | null;
  /** The bill just voted on from its gate, so the next render can bring the result into view. */
  justVoted: string | null;
  setJustVoted: (slug: string | null) => void;
  seedProgress: (progress: HudProgress) => void;
  setProgress: (progress: HudProgress) => void;
  reward: Reward | null;
  /** How many of your reps' votes you haven't weighed in on. Null until loaded. */
  pulseCount: number | null;
  loadPulseCount: (force?: boolean) => Promise<void>;
  /** Saves a vote right away, and rolls it back if the server refuses. */
  castVote: (slug: string, choice: Choice | null, previous: Choice | null) => Promise<boolean>;
  setFollow: (slug: string, following: boolean) => Promise<boolean>;
  setFavorite: (bioguideId: string, favorite: boolean) => Promise<boolean>;
  setTopic: (policyArea: string, tracked: boolean) => Promise<boolean>;
  loadReveal: (slug: string) => Promise<void>;
  clearReveal: (slug: string) => void;
  clearReward: () => void;
};

async function postJson(url: string, body: unknown): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // The screen has already changed, so leaving the page mustn't cancel the save.
    keepalive: true,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "That didn't save. Please try again.");
  }
  return response.json().catch(() => null);
}

let pulseRequest: Promise<void> | null = null;
let rewardId = 0;

export const useCivicStore = create<CivicState>((set, get) => ({
  votes: {},
  follows: {},
  favorites: {},
  topics: {},
  reveals: {},
  progress: null,
  justVoted: null,
  setJustVoted: (slug) => set({ justVoted: slug }),
  seedProgress: (progress) => {
    if (get().progress?.userId !== progress.userId) set({ progress });
  },
  setProgress: (progress) => set({ progress }),
  reward: null,
  pulseCount: null,

  loadPulseCount: async (force = false) => {
    if (get().pulseCount !== null && !force) return;
    // The badge is in both the sidebar and the bottom nav, and they load at the same moment.
    if (pulseRequest && !force) return pulseRequest;
    const request = (async () => {
      try {
        const response = await fetch("/api/civic/pulse");
        if (!response.ok) return;
        const data = await response.json();
        set({ pulseCount: data.count });
      } catch {
        // Only a badge, so it can stay hidden.
      } finally {
        if (pulseRequest === request) pulseRequest = null;
      }
    })();
    pulseRequest = request;
    return request;
  },

  castVote: async (slug, choice, previous) => {
    const change = (choice === null ? 0 : 1) - (previous === null ? 0 : 1);
    const before = get().progress;
    const after = before ? applyVote(before, change) : null;
    set((state) => ({
      votes: { ...state.votes, [slug]: choice },
      progress: after ?? state.progress,
      reward:
        change > 0
          ? {
              id: ++rewardId,
              xp: after && before ? after.xp - before.xp : XP_AMOUNTS.VOTE,
              message: `+${after && before ? after.xp - before.xp : XP_AMOUNTS.VOTE} XP`,
              celebration: before && after ? celebrate(before, after) : null,
            }
          : state.reward,
    }));
    try {
      const data = await postJson("/api/civic/bills/vote", { slug, position: choice });
      // The server's numbers include bonuses this tab can't know about.
      if (data?.progress) set({ progress: data.progress as HudProgress });
      // Voting may clear one of your reps' votes. The server knows which.
      if (change !== 0) get().loadPulseCount(true);
      return true;
    } catch (error) {
      set((state) => ({
        votes: { ...state.votes, [slug]: previous },
        progress: before,
        reward: null,
      }));
      throw error;
    }
  },

  setFollow: async (slug, following) => {
    set((state) => ({ follows: { ...state.follows, [slug]: following } }));
    try {
      await postJson("/api/civic/bills/follow", { slug, following });
      return true;
    } catch (error) {
      set((state) => ({ follows: { ...state.follows, [slug]: !following } }));
      throw error;
    }
  },

  setFavorite: async (bioguideId, favorite) => {
    set((state) => ({ favorites: { ...state.favorites, [bioguideId]: favorite } }));
    try {
      await postJson("/api/civic/people/favorite", { bioguideId, favorite });
      return true;
    } catch (error) {
      set((state) => ({ favorites: { ...state.favorites, [bioguideId]: !favorite } }));
      throw error;
    }
  },

  setTopic: async (policyArea, tracked) => {
    set((state) => ({ topics: { ...state.topics, [policyArea]: tracked } }));
    try {
      await postJson("/api/civic/topics", { policyArea, tracked });
      return true;
    } catch (error) {
      set((state) => ({ topics: { ...state.topics, [policyArea]: !tracked } }));
      throw error;
    }
  },

  loadReveal: async (slug) => {
    const current = get().reveals[slug]?.status;
    if (current === "ready" || current === "loading") return;
    set((state) => ({ reveals: { ...state.reveals, [slug]: { status: "loading" } } }));
    try {
      const response = await fetch(`/api/civic/bills/reveal?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error("reveal failed");
      const data = await response.json();
      set((state) => ({
        reveals: { ...state.reveals, [slug]: { status: "ready", reps: data.reps } },
      }));
    } catch {
      set((state) => ({
        reveals: {
          ...state.reveals,
          [slug]: { status: "error", message: "We couldn't load how your reps voted." },
        },
      }));
    }
  },

  clearReveal: (slug) =>
    set((state) => {
      const reveals = { ...state.reveals };
      delete reveals[slug];
      return { reveals };
    }),

  clearReward: () => set({ reward: null }),
}));

/**
 * Progress for whoever's signed in. Until the store has it, this is the server's value, so it's right
 * in the first paint. It ignores another account's numbers, in case someone switches without a reload.
 */
export function useProgress(initial: HudProgress): HudProgress {
  const stored = useCivicStore((state) => state.progress);
  const seed = useCivicStore((state) => state.seedProgress);
  useEffect(() => seed(initial), [seed, initial]);
  return stored?.userId === initial.userId ? stored : initial;
}
