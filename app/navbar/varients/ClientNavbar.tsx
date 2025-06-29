"use client";

import { useState, useEffect } from "react";
import NavUser from "@/components/nav-user";
import NavToggle from "../nav-toggle";
import NavbarTop from "../navbar-top";
import NavItem from "../NavItem";
import MobileNavbar from "./MobileNavbar";
import { UserSession } from "@/lib/types/user-types";
import { Session } from "next-auth";
import { navItems } from "../../data/navbarData"; // Import to reconstruct data
import { useNavbarStore } from "../useNavbarStore";

interface ClientNavbarProps {
  visibleNavHrefs: string[];
  session: Session | null;
  userRole?: string;
  children: React.ReactNode;
}

const ClientNavbar = ({
  visibleNavHrefs,
  session,
  userRole,
  children,
}: ClientNavbarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const setNavState = useNavbarStore((f) => f.setNavCollapsed);
  // Reconstruct nav items from hrefs
  const visibleNavItems = visibleNavHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter(Boolean); // Remove any undefined items

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (isMobile) {
    return (
      <MobileNavbar
        visibleNavItems={visibleNavItems}
        session={session}
        userRole={userRole}
      >
        {children}
      </MobileNavbar>
    );
  }

  // Desktop layout (your original layout)
  return (
    <div className="flex h-screen">
      <div className="nav-container w-64 flex flex-col h-full transition-all duration-300 ease-in-out">
        <NavToggle />

        <nav className="flex flex-col justify-between flex-1">
          <div>
            {visibleNavItems.map((item) => {
              return <NavItem key={item.href} href={item.href} />;
            })}
          </div>
          <div className="">
            <NavUser />
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <NavbarTop />
        {/* rest of app */}
        <div className="flex-1 overflow-auto">
          <div
            onClick={() => {
              setNavState(true);
            }}
            className="p-6 border-l-2 border-t-2 border-accent rounded-tl-2xl min-h-full"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientNavbar;
