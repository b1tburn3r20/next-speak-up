"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import NavUser from "@/components/nav-user";
import { useUserStore } from "@/app/admin/stores/use-user-store";
import { useAppStore } from "@/app/stores/use-app-store";
import { navItems } from "../../data/navbar-data";
import NavItem from "../nav-item";
import NavToggle from "../nav-toggle";
import NavbarTop from "../navbar-top";
import { useNavbarStore } from "../use-navbar-store";
import { MobileNavbar } from "./mobile-navbar";

interface ClientNavbarProps {
  visibleNavHrefs: string[];
  session: Session | null;
  userRole?: string;
  children: React.ReactNode;
}

/**
 * One layout for every screen size. CSS decides which navigation shows, so the page content
 * renders right away from the server rather than waiting for JavaScript to measure the window.
 */
const ClientNavbar = ({ visibleNavHrefs, userRole, children }: ClientNavbarProps) => {
  const setNavState = useNavbarStore((store) => store.setNavCollapsed);
  const setActiveUserRole = useUserStore((store) => store.setActiveUserRole);
  const setIsMobile = useAppStore((store) => store.setIsMobile);
  const pathname = usePathname();
  const visibleNavItems = visibleNavHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item) => item !== undefined);

  // Older components still read this value.
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setIsMobile]);

  useEffect(() => {
    if (userRole) setActiveUserRole(userRole);
  }, [userRole, setActiveUserRole]);

  if (pathname === "/" || pathname === "/mission") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh">
      <div className="nav-container hidden h-full w-64 flex-col border-r bg-background shadow-xs transition-all duration-300 md:flex">
        <NavToggle />
        <nav className="flex flex-1 flex-col justify-between" aria-label="Main">
          <div>
            {visibleNavItems.map((item) => (
              <NavItem key={item.href} href={item.href} />
            ))}
          </div>
          <NavUser />
        </nav>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden md:block">
          <NavbarTop />
        </div>
        <MobileNavbar items={visibleNavItems} />
        <div className="flex-1 overflow-auto">
          <div onClick={() => setNavState(true)} className="min-h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientNavbar;
