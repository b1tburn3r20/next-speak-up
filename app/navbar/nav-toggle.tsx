// nav-toggle.tsx (Client Component)
"use client";

import { useState } from "react";
import { ArrowLeft, Dot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavToggleProps {
  onChange: (boolean) => void;
}

const NavToggle = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleNav = () => {
    setIsExpanded(!isExpanded);
    const navContainer = document.querySelector(".nav-container");
    const navLogo = document.querySelector(".nav-logo");
    const navLabels = document.querySelectorAll(".nav-label");

    if (navContainer) {
      if (isExpanded) {
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
  };

  return (
    <div className="flex group items-center justify-between p-4  flex-shrink-0">
      <div className="nav-logo font-bold text-xl">Speakup</div>
      <div
        className={`${
          isExpanded && "opacity-0 group-hover:opacity-100 transition-all"
        } `}
      >
        <Button
          onClick={toggleNav}
          variant="ghost"
          className="p-2 rounded-lg  transition-colors"
        >
          {isExpanded ? <ArrowLeft size={20} /> : <Menu size={20} />}
        </Button>{" "}
      </div>
    </div>
  );
};

export default NavToggle;
