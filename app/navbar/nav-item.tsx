"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PulseDot } from "@/components/civic/pulse-dot";
import { activeNavHref } from "@/lib/nav";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { allNavHrefs, navItems, type NavItem as NavItemData } from "../data/navbar-data";
import { useNavbarStore } from "./use-navbar-store";

function NavRow({ item, active, child }: { item: NavItemData; active: boolean; child?: boolean }) {
  const collapsed = useNavbarStore((store) => store.navCollapsed);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center justify-start px-4 transition-colors",
        child ? "py-2" : "py-3",
        child && !collapsed && "pl-11",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon size={child ? 16 : 20} className={cn("shrink-0 transition-colors", active && "text-primary")} />
      <span className="nav-label ml-3 text-sm font-medium">{item.label}</span>
      {item.href === routes.vote ? <PulseDot className="nav-label ml-auto" /> : null}
      {active ? <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary" /> : null}
    </Link>
  );
}

/** A nav link and any links under it. Only the best match for the URL is ever active. */
const NavItem = ({ href }: { href: string }) => {
  const pathname = usePathname();
  const item = navItems.find((candidate) => candidate.href === href);
  if (!item) return null;
  const activeHref = activeNavHref(pathname, allNavHrefs);
  return (
    <>
      <NavRow item={item} active={activeHref === item.href} />
      {item.children?.map((child) => (
        <NavRow key={child.href} item={child} active={activeHref === child.href} child />
      ))}
    </>
  );
};

export default NavItem;
