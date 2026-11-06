// data/navbarData.ts
import {
  Book,
  Briefcase,
  CalendarClock,
  Group,
  Home,
  Key,
  LayoutDashboard,
  LucideIcon,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredRoles?: string[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  {
    href: "/legislators",
    icon: Briefcase,
    label: "Federal Legislators",
  },
  {
    href: "/bills",
    icon: Book,
    label: "Bills",
  },
  {
    href: "/bills/upcoming",
    icon: CalendarClock,
    label: "Upcoming Votes",
  },
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
