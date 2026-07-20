// data/navbarData.ts
import {
  Book,
  Briefcase,
  Building,
  Group,
  Home,
  Key,
  LayoutDashboard,
  LucideIcon,
  MapIcon,
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
    label: "Federal Legislators",
  },
  {
    href: "/state/legislators",
    icon: Building,
    label: "State Legislators",
  },
  {
    href: "/federal/election-map",
    icon: MapIcon,
    label: "Election Map",
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
