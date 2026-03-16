import { ModeToggle } from "@/components/ui/mode-toggle";
import React from "react";
import SiteSearch from "./site-search";

const NavbarTop = () => {
  return (
    <div className="bg-background z-10 p-1 px-4 flex justify-end gap-2 items-center shadow-sm">
      <ModeToggle />
      <SiteSearch />
    </div>
  );
};

export default NavbarTop;
