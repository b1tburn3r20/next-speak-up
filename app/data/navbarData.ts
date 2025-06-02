import { Home, Key, LucideIcon, Settings } from "lucide-react";

export type NavItem = {
    href: string;
    icon: LucideIcon;
    label: string;
}

export const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/admin/permissions", icon: Key, label: "Permissions" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];
