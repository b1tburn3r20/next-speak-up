"use client"
import { ModeToggle } from "@/components/ui/mode-toggle";
import React from "react";
import SiteSearch from "./site-search";
import Image from "next/image";
import { useNavbarStore } from "./useNavbarStore";

const NavbarTop = () => {

  const navCollapsed = useNavbarStore((f) => f.navCollapsed);

  return (
    <div className="bg-background justify-between z-10 p-1 px-4 flex gap-2 items-center shadow-sm">
      <div className="p-2">
        {
          !navCollapsed ? "" : (
            <Image height={50} width={100} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/logo.png"} />
          )
        }
      </div>
      <div className="flex gap-2 items-center ">

        <ModeToggle />
        <SiteSearch />
      </div>
    </div>
  );
};

export default NavbarTop;
