"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LandingNavbarData as navItems } from "./LandingNavbarData";
import LandingNavUser from "@/components/landing-nav-user";
import Link from "next/link";

const LandingDesktopNavbar = () => {
  const pathname = usePathname();
  const [navState, setNavState] = useState<"visible" | "hidden">("visible");
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScroll = window.scrollY;
    setIsAtTop(window.scrollY === 0);

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // Check if at top of page
      setIsAtTop(currentScroll === 0);

      // Scrolling up - show navbar
      if (currentScroll < lastScroll) {
        setNavState("visible");
      }
      // Scrolling down - hide the navbar
      else if (currentScroll > lastScroll) {
        setNavState("hidden");
      }

      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        navState === "visible"
          ? isAtTop
            ? "bg-transparent border-transparent"
            : "bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60"
          : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <div className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all duration-300">
              CoolBills
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/50 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Navigation */}
          <div className="flex items-center">
            <LandingNavUser />
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingDesktopNavbar;
