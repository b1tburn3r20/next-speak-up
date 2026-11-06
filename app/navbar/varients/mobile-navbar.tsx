"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavUser from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import type { NavItem as NavItemData } from "../../data/navbar-data";
import NavItem from "../nav-item";
import { BottomNav } from "./bottom-nav";
import { SearchButton } from "@/components/search/search-dialog";

/** The top bar and slide-out menu, shown only below the medium breakpoint. */
export function MobileNavbar({ items }: { items: NavItemData[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden" data-testid="mobile-navbar">
      <div className="flex items-center justify-between border-b border-primary bg-background px-3 py-1">
        <Link href="/dashboard" aria-label="Coolbills dashboard">
          <Image
            height={29}
            width={100}
            alt=""
            src="/images/assets/logo.png"
            style={{ width: 100, height: "auto" }}
          />
        </Link>
        <div className="flex items-center gap-1">
          <SearchButton compact />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Menu"
            className="fixed right-0 top-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col border-l border-primary/50 bg-background"
          >
            <div className="flex items-center justify-between border-b border-primary/50 p-3">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto" aria-label="Main">
              {items.map((item) => (
                <div key={item.href} onClick={() => setOpen(false)}>
                  <NavItem href={item.href} />
                </div>
              ))}
            </nav>
            <div className="border-t border-primary/50">
              <NavUser />
            </div>
          </div>
        </>
      ) : null}
      <BottomNav />
    </div>
  );
}
