"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, Scale, Users, Vote } from "lucide-react";
import { PulseDot } from "@/components/civic/pulse-dot";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { activeNavHref } from "@/lib/nav";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/vote", label: "Vote", icon: Vote },
  { href: routes.federal.upcoming, label: "Upcoming", icon: CalendarClock },
  { href: "/reps", label: "My reps", icon: Scale },
  { href: routes.federal.legislators, label: "Congress", icon: Users },
];

/** The main places, in reach of a thumb. Phones only. */
export function BottomNav() {
  const pathname = usePathname();
  const activeHref = activeNavHref(pathname, TABS.map((tab) => tab.href));
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      data-testid="bottom-nav"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = activeHref === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-extrabold",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon className="size-5" aria-hidden />
              {href === "/vote" ? <PulseDot className="absolute -right-3 -top-2" /> : null}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
