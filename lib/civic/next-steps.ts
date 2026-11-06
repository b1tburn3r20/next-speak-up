// What someone should do next. Pure, so every page can ask, and tests can cover each situation.
import { MIN_VOTES_FOR_VERDICT } from "./verdict";

export type NextStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "primary" | "support" | "streak" | "xp";
};

export type NextStepState = {
  signedIn: boolean;
  hasLocation: boolean;
  pulseCount: number;
  floorCount: number;
  /** Shared votes with the rep they've compared with least. */
  fewestComparedWithRep: number;
  votedToday: number;
  dailyGoal: number;
  streak: number;
  votesCast: number;
  followingCount: number;
};

/** Ordered by what matters most right now. There's always at least one. */
export function computeNextSteps(state: NextStepState): NextStep[] {
  const steps: NextStep[] = [];
  if (!state.signedIn) {
    steps.push({
      id: "sign-up",
      title: "Find out if your reps represent you",
      description: "Vote on real bills, then see how your representative and senators voted.",
      href: "/vote",
      cta: "Try it now",
      tone: "primary",
    });
    steps.push({
      id: "see-upcoming",
      title: "See what Congress may vote on",
      description: "The bills coming up next, in plain words.",
      href: "/bills/upcoming",
      cta: "See upcoming votes",
      tone: "xp",
    });
    return steps;
  }
  if (!state.hasLocation) {
    steps.push({
      id: "find-reps",
      title: "Find your representatives",
      description: "Takes a few seconds. Then you can see if they vote the way you would.",
      href: "/settings",
      cta: "Find my reps",
      tone: "primary",
    });
  }
  if (state.hasLocation && state.pulseCount > 0) {
    const needed = MIN_VOTES_FOR_VERDICT - state.fewestComparedWithRep;
    steps.push({
      id: "pulse",
      title:
        state.pulseCount === 1
          ? "Your rep voted on a bill. Do you agree?"
          : `Your reps voted on ${state.pulseCount} bills you haven't weighed in on`,
      description:
        needed > 0
          ? `Vote first, then find out. ${needed} more until you get a verdict on your reps.`
          : "Vote first, then find out if you match.",
      href: "/vote",
      cta: "Start voting",
      tone: "primary",
    });
  }
  if (state.floorCount > 0) {
    steps.push({
      id: "floor",
      title: `${state.floorCount} bill${state.floorCount === 1 ? "" : "s"} may come up for a vote soon`,
      description: "Weigh in before your representative does.",
      href: "/bills/upcoming",
      cta: "See upcoming votes",
      tone: "support",
    });
  }
  if (state.votedToday < state.dailyGoal && state.votedToday > 0) {
    const left = state.dailyGoal - state.votedToday;
    steps.push({
      id: "daily-goal",
      title: `${left} more vote${left === 1 ? "" : "s"} to reach today's goal`,
      description: state.streak > 0 ? `You're on a ${state.streak}-day streak.` : "Start a streak today.",
      href: "/vote",
      cta: "Keep going",
      tone: "streak",
    });
  }
  if (state.votesCast > 0) {
    steps.push({
      id: "report-card",
      title: "See how your reps are doing",
      description: "Attendance, bills passed, and where you agree and differ.",
      href: "/reps",
      cta: "See report cards",
      tone: "xp",
    });
  }
  steps.push({
    id: "explore-topic",
    title: "Explore a topic you care about",
    description: "Health, taxes, immigration, and more, explained simply.",
    href: "/topics",
    cta: "Browse topics",
    tone: "xp",
  });
  if (state.followingCount === 0) {
    steps.push({
      id: "follow",
      title: "Follow a bill you care about",
      description: "Keep track of it on your dashboard.",
      href: "/bills",
      cta: "Browse bills",
      tone: "support",
    });
  }
  return steps;
}
