import {
  Book,
  Briefcase,
  Building2,
  CalendarClock,
  Compass,
  GraduationCap,
  Home,
  Key,
  Landmark,
  LucideIcon,
  Map,
  Scale,
  Settings,
  Sparkles,
  Trophy,
  Vote,
} from "lucide-react";
import type { NavAccess } from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";

/**
 * Where a link sits. People think in three questions: what do I do now (the top), how am I doing (You),
 * and which government am I looking at (Congress, or Where you live). Everything else is More.
 */
export type NavGroup = "main" | "you" | "congress" | "local" | "more";

export const NAV_GROUPS: { id: NavGroup; label: string | null }[] = [
  { id: "main", label: null },
  { id: "you", label: "You" },
  { id: "congress", label: "Congress" },
  { id: "local", label: "Where you live" },
  { id: "more", label: "More" },
];

export type NavItem = NavAccess & {
  href: string;
  icon: LucideIcon;
  label: string;
  group: NavGroup;
  /** Only for people who live in a state we cover. It goes to their state's page. */
  inCoveredState?: boolean;
  /** Secondary pages, shown indented under this link. */
  children?: NavItem[];
};

// See "Navigation" in docs/ui-guidelines.md.
export const navItems: NavItem[] = [
  { href: routes.dashboard, icon: Home, label: "Home", group: "main" },
  { href: routes.vote, icon: Vote, label: "Vote", group: "main" },
  { href: routes.reps, icon: Scale, label: "My Reps", group: "you" },
  { href: routes.progress, icon: Sparkles, label: "My Progress", group: "you", signedIn: true },
  { href: routes.leaderboard, icon: Trophy, label: "Leaderboard", group: "you", signedIn: true },
  { href: routes.federal.upcoming, icon: CalendarClock, label: "Upcoming Votes", group: "congress" },
  {
    href: routes.federal.bills,
    icon: Book,
    label: "Bills",
    group: "congress",
    children: [{ href: routes.federal.topics, icon: Compass, label: "Topics", group: "congress" }],
  },
  { href: routes.federal.legislators, icon: Briefcase, label: "Legislators", group: "congress" },
  // These two take the person's own state and city as their labels, like "Iowa" and "Ankeny".
  { href: routes.myState, icon: Landmark, label: "My State", group: "local", inCoveredState: true },
  { href: routes.myCity, icon: Building2, label: "My City", group: "local", inCoveredState: true },
  { href: routes.states, icon: Map, label: "States", group: "local" },
  { href: routes.learn, icon: GraduationCap, label: "Learn the Lingo", group: "more" },
  { href: routes.settings, icon: Settings, label: "Settings", group: "more", signedIn: true },
  { href: "/admin", icon: Key, label: "Admin", group: "more", permission: "admin.view" },
];

/** Every link, children included, because only one of them is ever active. */
export const allNavHrefs: string[] = navItems.flatMap((item) => [
  item.href,
  ...(item.children ?? []).map((child) => child.href),
]);

/** Labels that depend on the person: their state's and city's names. */
export type NavLabels = Partial<Record<string, string>>;
