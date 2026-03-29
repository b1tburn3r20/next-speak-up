// data/navbarData.ts
import {
  Book,
  Briefcase,
  Group,
  Home,
  Key,
  LayoutDashboard,
  LucideIcon,
  Settings,
  Smile,
  Users,
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
    label: "Legislators",
  },
  {
    href: "/bills",
    icon: Book,
    label: "Bills",
  },
  {
    href: "/dev/add-contacts",
    icon: Smile,
    label: "Add Contacts to Legislators",
    requiredRoles: ["Admin", "Super Admin"]
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
