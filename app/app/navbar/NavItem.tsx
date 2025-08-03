// components/NavItem.tsx (Client Component)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/app/data/navbarData";

interface NavItemProps {
  href: string; // Only pass the href as a string
}

const NavItem = ({ href }: NavItemProps) => {
  const pathname = usePathname();

  // Find the nav item data using href lookup
  const navItem = navItems.find((item) => item.href === href);

  // Handle case where href doesn't match any nav item
  if (!navItem) {
    console.warn(`No nav item found for href: ${href}`);
    return null;
  }

  const IconComponent = navItem.icon;

  // Improved active state logic
  const isActive = (() => {
    // Special case for home route - only active on exact match
    if (href === "/app") {
      return pathname === "/app";
    }

    // For other routes, find the most specific matching route
    const matchingRoutes = navItems
      .filter((item) => item.href !== "/app" && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length); // Sort by specificity (longest first)

    // Return true only if this is the most specific match
    return matchingRoutes.length > 0 && matchingRoutes[0].href === href;
  })();

  return (
    <Link
      href={href}
      className={`flex items-center justify-start px-4 py-3 transition-colors relative ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <IconComponent
        size={20}
        className={`flex-shrink-0 transition-colors ${
          isActive ? "text-primary" : ""
        }`}
      />
      <span className="nav-label ml-3 text-sm font-medium">
        {navItem.label}
      </span>
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}
    </Link>
  );
};

export default NavItem;
