"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import type { HudProgress } from "@/lib/civic/progress";
import NavUser from "@/components/nav-user";
import { useUserStore } from "@/app/admin/stores/use-user-store";
import { useAppStore } from "@/app/stores/use-app-store";
import { NAV_GROUPS, navItems, type NavItem as NavItemData, type NavLabels } from "../../data/navbar-data";
import NavItem from "../nav-item";
import NavbarTop from "../navbar-top";
import { useNavbarStore } from "../use-navbar-store";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/search/search-dialog";
import { MobileNavbar } from "./mobile-navbar";

interface ClientNavbarProps {
  visibleNavHrefs: string[];
  labels: NavLabels;
  session: Session | null;
  hud: HudProgress | null;
  userRole?: string;
  children: React.ReactNode;
}

/** The visible links, in their groups, with empty groups left out. */
export function groupNavItems(items: NavItemData[]) {
  return NAV_GROUPS.map((group) => ({ ...group, items: items.filter((item) => item.group === group.id) })).filter((group) => group.items.length > 0);
}

/**
 * One layout for every screen size. CSS decides which navigation shows, so the page content
 * renders right away from the server rather than waiting for JavaScript to measure the window.
 */
const ClientNavbar = ({ visibleNavHrefs, labels, session, userRole, hud, children }: ClientNavbarProps) => {
  const collapsed = useNavbarStore((store) => store.navCollapsed);
  const setActiveUserRole = useUserStore((store) => store.setActiveUserRole);
  const setIsMobile = useAppStore((store) => store.setIsMobile);
  const pathname = usePathname();
  const visibleNavItems = visibleNavHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item) => item !== undefined);
  const groups = groupNavItems(visibleNavItems);
  const visibleHrefs = visibleNavItems.flatMap((item) => [item.href, ...(item.children ?? []).map((child) => child.href)]);

  // Older components still read this value.
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setIsMobile]);

  useEffect(() => {
    if (userRole) setActiveUserRole(userRole);
  }, [userRole, setActiveUserRole]);

  // Onboarding is a focused flow. Everything else, the front page included, has the same bar and menu.
  if (pathname === routes.onboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col">
      <NavbarTop hud={hud} signedIn={Boolean(session?.user)} />
      <MobileNavbar groups={groups} labels={labels} hud={hud} />
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "nav-container hidden h-full shrink-0 flex-col border-r-2 bg-background transition-[width] duration-200 motion-reduce:transition-none md:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <nav className="flex min-h-0 flex-1 flex-col" aria-label="Main">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-3">
              {groups.map((group) => (
                <div key={group.id} data-testid={`nav-group-${group.id}`}>
                  {group.label ? (
                    collapsed ? (
                      <div className="mx-4 mb-1 border-t-2" aria-hidden />
                    ) : (
                      <p className="px-5 pb-1 text-[0.7rem] font-extrabold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                    )
                  ) : null}
                  {group.items.map((item) => (
                    <NavItem key={item.href} href={item.href} visibleHrefs={visibleHrefs} labels={labels} />
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t-2">
              <NavUser />
            </div>
          </nav>
        </div>

        <SearchDialog />
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="min-h-full">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ClientNavbar;
