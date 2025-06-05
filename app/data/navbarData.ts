// data/navbarData.ts
import { Group, Home, Key, LucideIcon, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredRoles?: string[];
};

export const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  {
    href: "/admin/permissions",
    icon: Key,
    label: "Permissions",
    requiredRoles: ["Super Admin", "Admin"],
  },
  { href: "/forum", icon: Group, label: "Forum", requiredRoles: ["Member"] },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    requiredRoles: ["Member"],
  },
];
