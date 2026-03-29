"use client";

import { useEffect } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavbarStore } from "./useNavbarStore";
import Image from "next/image";

const NavToggle = () => {
  const navCollapsed = useNavbarStore((f) => f.navCollapsed);
  const setNavCollapsed = useNavbarStore((d) => d.setNavCollapsed);

  useEffect(() => {
    const isLocalStorageNavExpanded = localStorage.getItem("isNavbarExpanded");

    if (isLocalStorageNavExpanded && isLocalStorageNavExpanded === "true") {
      setNavCollapsed(true);
    }
  }, []);
  useEffect(() => {
    const navContainer = document.querySelector(".nav-container");
    const navLogo = document.querySelector(".nav-logo");
    const navLabels = document.querySelectorAll(".nav-label");

    if (navContainer) {
      if (navCollapsed) {
        navContainer.classList.remove("w-64");
        navContainer.classList.add("w-16");
        navLogo?.classList.add("hidden");
        navLabels.forEach((label) => label.classList.add("hidden"));
      } else {
        navContainer.classList.remove("w-16");
        navContainer.classList.add("w-64");
        navLogo?.classList.remove("hidden");
        navLabels.forEach((label) => label.classList.remove("hidden"));
      }
    }
  }, [navCollapsed]);

  const toggleNav = () => {
    localStorage.setItem("isNavbarExpanded", String(!navCollapsed));
    setNavCollapsed(!navCollapsed);
  };

  return (
    <div className="flex group items-start justify-between p-2 shrink-0">
      <div className={navCollapsed ? "" : "p-2"}>
        {
          navCollapsed ? "" : (
            <Image height={50} width={100} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/logo.png"} />
          )
        }
      </div>
      <div
      >
        <Button
          onClick={toggleNav}
          variant="default"
          className="p-2 rounded-lg transition-colors"
        >
          {navCollapsed ? <Menu size={20} /> : <ArrowLeft size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default NavToggle;
