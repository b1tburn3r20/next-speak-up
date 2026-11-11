"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Landmark, LayoutGrid, Map, Vote } from "lucide-react";
import NavUser from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { NavItem, NavLabels } from "@/app/data/navbar-data";
import { activeNavHref, activeVisibleHref } from "@/lib/nav";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Group = { id: string; label: string | null; items: NavItem[] };
type Tab = { href: string; label: string; icon: typeof Home; match: string[] };

/**
 * The phone's tabs: the two things to do (Home, Vote), the two governments (Congress, and the person's
 * own state), and More for everything else. A tab lights up for every page under it.
 */
export function phoneTabs(visible: Set<string>, labels: NavLabels): Tab[] {
  const local: Tab = visible.has(routes.myState)
    ? { href: routes.myState, label: labels[routes.myState] ?? "My State", icon: Landmark, match: [routes.myState, routes.myCity, routes.states] }
    : { href: routes.states, label: "States", icon: Map, match: [routes.states, routes.myState, routes.myCity] };
  return [
    { href: routes.dashboard, label: "Home", icon: Home, match: [routes.dashboard] },
    { href: routes.vote, label: "Vote", icon: Vote, match: [routes.vote] },
    { href: routes.federal.home, label: "Congress", icon: Building2, match: [routes.federal.home] },
    local,
  ];
}

function tabClass(active: boolean) {
  return cn(
    "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-extrabold",
    active ? "text-primary" : "text-muted-foreground",
  );
}

/** The main places, in reach of a thumb, and More, which holds every other page. Phones only. */
export function BottomNav({ groups, labels }: { groups: Group[]; labels: NavLabels }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = new Set(groups.flatMap((group) => group.items.map((item) => item.href)));
  const tabs = phoneTabs(visible, labels);
  const tabHref = activeNavHref(pathname, tabs.flatMap((tab) => tab.match));
  const activeTab = tabs.find((tab) => tabHref !== null && tab.match.includes(tabHref)) ?? null;
  // More lights up for a page that's only in it, like My Reps or Settings.
  const sheetHref = activeVisibleHref(pathname, groups.flatMap((group) => group.items.flatMap((item) => [item.href, ...(item.children ?? []).map((child) => child.href)])));
  const moreActive = !activeTab && sheetHref !== null;
  const sheetGroups = groups.filter((group) => group.id !== "main");

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        data-testid="bottom-nav"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = activeTab?.href === href;
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={tabClass(active)} data-testid="bottom-tab">
              <Icon className="size-5" aria-hidden />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(tabClass(moreActive || open), "h-auto rounded-none hover:bg-transparent")}
          data-testid="mobile-menu-button"
        >
          <LayoutGrid className="size-5" aria-hidden />
          More
        </Button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]" aria-describedby={undefined}>
          <SheetHeader className="pb-1">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav aria-label="Main" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-3">
            {sheetGroups.map((group) => (
              <section key={group.id}>
                <h3 className="pb-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                <ul className="grid grid-cols-3 gap-2">
                  {group.items.flatMap((item) => [item, ...(item.children ?? [])]).map((item) => {
                    const Icon = item.icon;
                    const active = sheetHref === item.href;
                    const label = labels[item.href] ?? item.label;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-full min-h-18 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 p-2 text-center text-xs font-extrabold",
                            active ? "border-primary bg-primary-tint text-primary" : "bg-card text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                          <span className="line-clamp-2 break-words">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
          <div className="border-t-2">
            <NavUser />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
