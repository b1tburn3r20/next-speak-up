// Global client state for what the user does: votes, follows, saved members, and reveals.
//
// Rules, from docs/ui-guidelines.md:
// - Read one value with a selector, like useCivicStore((s) => s.votes[slug]). That way, voting on
//   one bill re-renders only that bill's buttons.
// - The server renders first paint from the database, and components take that as an initial
//   value. This store only holds what's changed since. It's never written during server rendering,
//   because a module-level store would be shared between users there.
import { create } from "zustand";
import { XP_PER_VOTE } from "@/lib/civic/progress";

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

export type Reward = { id: number; xp: number; message: string };

type CivicState = {
  votes: Record<string, Choice | null>;
  follows: Record<string, boolean>;
  favorites: Record<string, boolean>;
  reveals: Record<string, RevealState>;
  /** Votes cast or undone since this page was loaded, added to the server's numbers. */
  voteDelta: number;
  reward: Reward | null;
  /** Saves a vote right away, and rolls it back if the server refuses. */
  castVote: (slug: string, choice: Choice | null, previous: Choice | null) => Promise<boolean>;
  setFollow: (slug: string, following: boolean) => Promise<boolean>;
  setFavorite: (bioguideId: string, favorite: boolean) => Promise<boolean>;
  loadReveal: (slug: string) => Promise<void>;
  clearReveal: (slug: string) => void;
  clearReward: () => void;
};

async function postJson(url: string, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "That didn't save. Please try again.");
  }
}

let rewardId = 0;

export const useCivicStore = create<CivicState>((set, get) => ({
  votes: {},
  follows: {},
  favorites: {},
  reveals: {},
  voteDelta: 0,
  reward: null,

  castVote: async (slug, choice, previous) => {
    const change = (choice === null ? 0 : 1) - (previous === null ? 0 : 1);
    set((state) => ({
      votes: { ...state.votes, [slug]: choice },
      voteDelta: state.voteDelta + change,
      reward:
        change > 0
          ? { id: ++rewardId, xp: XP_PER_VOTE, message: `+${XP_PER_VOTE} XP` }
          : state.reward,
    }));
    try {
      await postJson("/api/civic/bills/vote", { slug, position: choice });
      return true;
    } catch (error) {
      set((state) => ({
        votes: { ...state.votes, [slug]: previous },
        voteDelta: state.voteDelta - change,
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
