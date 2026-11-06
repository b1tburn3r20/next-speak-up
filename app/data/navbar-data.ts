// data/navbarData.ts
import {
  Book,
  Briefcase,
  CalendarClock,
  Compass,
  GraduationCap,
  Home,
  Key,
  LucideIcon,
  Scale,
  Settings,
  Vote,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredRoles?: string[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/vote", icon: Vote, label: "Vote" },
  { href: "/reps", icon: Scale, label: "My Reps" },
  { href: "/bills/upcoming", icon: CalendarClock, label: "Upcoming Votes" },
  { href: "/bills", icon: Book, label: "Bills" },
  { href: "/legislators", icon: Briefcase, label: "Federal Legislators" },
  { href: "/topics", icon: Compass, label: "Topics" },
  { href: "/learn", icon: GraduationCap, label: "Learn the Lingo" },
  // {
  //   href: "/forum",
  //   icon: Users,
  //   label: "Forum",
  // },
  {
    href: "/admin/permissions",
    icon: Key,
    label: "Permissions",
    requiredRoles: ["Super Admin", "Admin"],
  },

  // { href: "/", icon: Home, label: "Home" },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    requiredRoles: ["Member", "Supporter", "Super Admin"],
  },
];
