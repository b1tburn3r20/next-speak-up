"use client";

import { useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavbarStore } from "./use-navbar-store";

const STORAGE_KEY = "isNavbarExpanded";

/**
 * The menu button at the far left of the top bar, which narrows the sidebar to icons and back, like
 * most sites put it. The choice is remembered on this device. Computers and tablets only.
 */
const NavToggle = () => {
  const collapsed = useNavbarStore((store) => store.navCollapsed);
  const setCollapsed = useNavbarStore((store) => store.setNavCollapsed);

  useEffect(() => {
    try {
      // The stored value has meant "collapsed" since before it was renamed.
      if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
    } catch {
      // Storage can be blocked. The sidebar just starts open.
    }
  }, [setCollapsed]);

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(!collapsed));
    } catch {
      // Not remembered, but it still toggles.
    }
    setCollapsed(!collapsed);
  };

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      aria-label={collapsed ? "Show the menu's names" : "Shrink the menu to icons"}
      title={collapsed ? "Show the menu's names" : "Shrink the menu to icons"}
      aria-expanded={!collapsed}
      data-testid="nav-toggle"
      className="hidden shrink-0 text-muted-foreground md:inline-flex"
    >
      <Menu className="size-5" aria-hidden />
    </Button>
  );
};

export default NavToggle;
