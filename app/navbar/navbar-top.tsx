"use client"
import { ModeToggle } from "@/components/ui/mode-toggle";
import SiteSearch from "./site-search";
import Image from "next/image";
import { useNavbarStore } from "./useNavbarStore";
import SideBlock from "@/components/cb/side-block";
import Link from "next/link";

const NavbarTop = () => {

  const navCollapsed = useNavbarStore((f) => f.navCollapsed);

  return (
    <div className="bg-background justify-between z-10 p-1 px-4 flex gap-2 items-center shadow-sm h-13.5">
      <div className="p-2">
        {
          !navCollapsed ? "" : (
            <Link href={"/"}>
              <SideBlock>
                <Image height={25} width={25} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/icon.png"} />
                <Image height={29} width={100} alt="The logo for the company coolbills, it is the word coolbills in blue with a red l signifying the mix of partisanship" src={"/images/assets/logo.png"} />
              </SideBlock>
            </Link>
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
