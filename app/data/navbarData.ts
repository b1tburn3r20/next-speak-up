// data/navbarData.ts
import {
  Book,
  Group,
  Home,
  Key,
  LucideIcon,
  Settings,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredRoles?: string[];
};

export const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  {
    href: "/bills",
    icon: Book,
    label: "Bills",
  },
  {
    href: "/forum",
    icon: Users,
    label: "Forum",
  },
  {
    href: "/admin/permissions",
    icon: Key,
    label: "Permissions",
    requiredRoles: ["Super Admin", "Admin"],
  },

  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    requiredRoles: ["Member", "Supporter", "Super Admin"],
  },
];
