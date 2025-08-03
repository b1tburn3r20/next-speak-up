// data/navbarData.ts
import {
  Book,
  Briefcase,
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
  { href: "/app", icon: Home, label: "Home" },
  {
    href: "/app/bills",
    icon: Book,
    label: "Bills",
  },
  {
    href: "/app/legislators",
    icon: Briefcase,
    label: "Legislators",
  },
  {
    href: "/app/forum",
    icon: Users,
    label: "Forum",
  },
  {
    href: "/app/admin/permissions",
    icon: Key,
    label: "Permissions",
    requiredRoles: ["Super Admin", "Admin"],
  },

  {
    href: "/app/settings",
    icon: Settings,
    label: "Settings",
    requiredRoles: ["Member", "Supporter", "Super Admin"],
  },
];
