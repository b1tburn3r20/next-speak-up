"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LandingNavbarData as navItems } from "./LandingNavbarData";
import LandingNavUser from "@/components/landing-nav-user";
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/ui/mode-toggle";
import SideBlock from "@/components/cb/side-block";

const LandingDesktopNavbar = () => {
  const pathname = usePathname();
  const [navState, setNavState] = useState<"visible" | "hidden">("visible");
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScroll = window.scrollY;
    setIsAtTop(window.scrollY === 0);

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsAtTop(currentScroll === 0);
      if (currentScroll < lastScroll) {
        setNavState("visible");
      }
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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navState === "visible"
        ? isAtTop
          ? "bg-transparent border-transparent"
          : "bg-background/95 backdrop-blur-sm border-b supports-backdrop-filter:bg-background/60"
        : "-translate-y-full"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href={"/"}>
            <SideBlock>
              <Image height={25} width={25} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/icon.png"} />
              <Image height={29} width={100} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/logo.png"} />
            </SideBlock>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/50 ${isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LandingNavUser />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingDesktopNavbar;
