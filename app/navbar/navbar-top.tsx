"use client"
import { Hud } from "@/components/civic/hud";
import { ThemeToggle } from "@/components/theme-toggle";
import type { HudProgress } from "@/lib/civic/progress";
import { SearchButton } from "@/components/search/search-dialog";
import Image from "next/image";
import { useNavbarStore } from "./use-navbar-store";
import SideBlock from "@/components/cb/side-block";
import Link from "next/link";

const NavbarTop = ({ hud }: { hud: HudProgress | null }) => {

  const navCollapsed = useNavbarStore((f) => f.navCollapsed);

  return (
    <div className="bg-background justify-between z-10 p-1 px-4 flex min-w-0 gap-2 items-center shadow-sm h-13.5">
      <div className="p-2">
        {
          !navCollapsed ? "" : (
            <Link href={"/"}>
              <SideBlock>
                <Image height={25} width={25} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/icon.png"} />
                <Image height={29} width={100} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/logo.png"} style={{ width: 100, height: "auto" }} loading="eager" />
              </SideBlock>
            </Link>
          )
        }
      </div>
      <div className="flex gap-2 items-center lg:gap-3">
        {hud ? <Hud initial={hud} /> : null}
        <SearchButton />
        <ThemeToggle />
      </div>
    </div>
  );
};

export default NavbarTop;
