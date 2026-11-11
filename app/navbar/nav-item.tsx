"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeVisibleHref } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { navItems, type NavItem as NavItemData } from "../data/navbar-data";
import { useNavbarStore } from "./use-navbar-store";

function NavRow({ item, label, active, child, onNavigate }: { item: NavItemData; label: string; active: boolean; child?: boolean; onNavigate?: () => void }) {
  const collapsed = useNavbarStore((store) => store.navCollapsed);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative mx-2 flex items-center rounded-xl transition-colors",
        collapsed ? "justify-center py-2.5" : "gap-3 px-3",
        !collapsed && (child ? "py-1.5 pl-10" : "py-2"),
        active ? "bg-primary-tint font-extrabold text-primary" : "font-bold text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("shrink-0", child ? "size-4" : "size-5")} aria-hidden />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate text-sm">{label}</span>}
    </Link>
  );
}

/** A nav link and any links under it. Only the best match for the URL is ever active. */
const NavItem = ({ href, visibleHrefs, labels, onNavigate }: { href: string; visibleHrefs: string[]; labels?: Partial<Record<string, string>>; onNavigate?: () => void }) => {
  const pathname = usePathname();
  const collapsed = useNavbarStore((store) => store.navCollapsed);
  const item = navItems.find((candidate) => candidate.href === href);
  if (!item) return null;
  const activeHref = activeVisibleHref(pathname, visibleHrefs);
  return (
    <>
      <NavRow item={item} label={labels?.[item.href] ?? item.label} active={activeHref === item.href} onNavigate={onNavigate} />
      {collapsed
        ? null
        : item.children?.map((child) => <NavRow key={child.href} item={child} label={child.label} active={activeHref === child.href} child onNavigate={onNavigate} />)}
    </>
  );
};

export default NavItem;
