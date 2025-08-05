"use client";
// LandingDesktopNavbar.jsx
import { usePathname } from "next/navigation";
import React from "react";
import { LandingNavbarData as navItems } from "./LandingNavbarData";
import LandingNavUser from "@/components/landing-nav-user";
import Link from "next/link";
const LandingDesktopNavbar = () => {
  const pathname = usePathname();

  return (
    <div className="bg-background border-b border-primary">
      <div className="">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="font-semibold text-xl">CoolBills</div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-foreground hover:text-primary transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                    active ? "text-primary" : "text-unset"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <LandingNavUser />
        </div>
      </div>
    </div>
  );
};
export default LandingDesktopNavbar;
