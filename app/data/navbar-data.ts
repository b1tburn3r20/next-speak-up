import {
  Book,
  Briefcase,
  CalendarClock,
  Sparkles,
  Trophy,
  Compass,
  GraduationCap,
  Home,
  Key,
  LucideIcon,
  Scale,
  Settings,
  Vote,
} from "lucide-react";
import type { NavAccess } from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";

export type NavItem = NavAccess & {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Secondary pages, shown indented under this link. */
  children?: NavItem[];
};

// Core features are root links. See "Navigation" in docs/ui-guidelines.md.
export const navItems: NavItem[] = [
  { href: routes.dashboard, icon: Home, label: "Dashboard" },
  { href: routes.vote, icon: Vote, label: "Vote" },
  { href: routes.reps, icon: Scale, label: "My Reps" },
  { href: routes.progress, icon: Sparkles, label: "My Progress", signedIn: true },
  { href: routes.leaderboard, icon: Trophy, label: "Leaderboard", signedIn: true },
  { href: routes.federal.upcoming, icon: CalendarClock, label: "Upcoming Votes" },
  {
    href: routes.federal.bills,
    icon: Book,
    label: "Bills",
    children: [{ href: routes.federal.topics, icon: Compass, label: "Topics" }],
  },
  { href: routes.federal.legislators, icon: Briefcase, label: "Legislators" },
  { href: routes.learn, icon: GraduationCap, label: "Learn the Lingo" },
  { href: "/admin", icon: Key, label: "Admin", permission: "admin.view" },
  { href: routes.settings, icon: Settings, label: "Settings", signedIn: true },
];

/** Every link, children included, because only one of them is ever active. */
export const allNavHrefs: string[] = navItems.flatMap((item) => [
  item.href,
  ...(item.children ?? []).map((child) => child.href),
]);
