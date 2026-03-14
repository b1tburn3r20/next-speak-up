"use client";

import { useState, useEffect } from "react";
import NavUser from "@/components/nav-user";
import NavToggle from "../nav-toggle";
import NavItem from "../NavItem";
import MobileNavbar from "./MobileNavbar";
import { Session } from "next-auth";
import { navItems } from "../../data/navbarData";
import { useNavbarStore } from "../useNavbarStore";
import { useUserStore } from "@/app/admin/stores/useUserStore";
import { usePathname } from "next/navigation";
import NavbarTop from "../navbar-top";

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
  const setActiveUserRole = useUserStore((f) => f.setActiveUserRole);
  const pathname = usePathname();
  const visibleNavItems = visibleNavHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter(Boolean);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();

    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);



  useEffect(() => {
    if (userRole) {
      setActiveUserRole(userRole);
    }
  }, [userRole]);

  if (pathname === "/" || pathname === "/mission") {
    return <>{children}</>;
  }

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

  return (
    <div className="flex h-screen">
      <div className="nav-container shadow-xs bg-background border-r w-64 flex flex-col h-full transition-all duration-300 ease-in-out">
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
        <div className="flex-1 overflow-auto">
          <div
            onClick={() => {
              setNavState(true);
            }}
            className="min-h-full"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientNavbar;
