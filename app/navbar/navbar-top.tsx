import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Search } from "lucide-react";
import React from "react";

const NavbarTop = () => {
  return (
    <div className="p-1 m-1 flex justify-end gap-2 items-center">
      <ModeToggle />
      <div className="relative">
        <Search className="absolute top-2 left-3" />
        <Input className="pl-12 h-10" placeholder="Search anything..." />
      </div>
    </div>
  );
};

export default NavbarTop;
