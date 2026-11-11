"use client";

import Image from "next/image";
import Link from "next/link";
import { Hud } from "@/components/civic/hud";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchButton } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import type { HudProgress } from "@/lib/civic/progress";
import NavToggle from "./nav-toggle";
import { useLoginStore } from "./use-login-store";
import { Button } from "@/components/ui/button";

function SignInButton() {
  const open = useLoginStore((store) => store.setIsLoginDialogOpen);
  return (
    <Button size="sm" onClick={() => open(true)} className="whitespace-nowrap" data-testid="top-sign-in">
      Log in
    </Button>
  );
}

/**
 * The bar across the top of every page, at every size: the menu button and logo on the left, search
 * in the middle, and what's yours (progress and notifications) on the right. The logo goes to the
 * front page, which says what Coolbills is. Home is in the menu.
 */
const NavbarTop = ({ hud, signedIn }: { hud: HudProgress | null; signedIn: boolean }) => (
  <header className="z-20 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b-2 bg-background px-2 sm:px-3 md:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)_minmax(0,1fr)]" data-testid="top-bar">
    <div className="flex min-w-0 items-center gap-1">
      <NavToggle />
      <Link href="/" aria-label="Coolbills, the front page" className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1" data-testid="logo-link">
        <Image height={28} width={28} alt="" src="/images/assets/icon.png" className="hidden sm:block" />
        <Image height={29} width={100} alt="Coolbills" src="/images/assets/logo.png" className="h-6 sm:h-7" style={{ width: "auto" }} loading="eager" />
      </Link>
    </div>
    <div className="flex min-w-0 justify-end md:justify-center md:px-2">
      <SearchButton />
    </div>
    <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1.5">
      {hud ? <Hud initial={hud} /> : null}
      {signedIn ? <NotificationBell /> : <SignInButton />}
      <ThemeToggle />
    </div>
  </header>
);

export default NavbarTop;
