"use client";

import type { NavItem, NavLabels } from "../../data/navbar-data";
import { BottomNav } from "./bottom-nav";
import { HudStrip } from "@/components/civic/hud";
import type { HudProgress } from "@/lib/civic/progress";

/** What only phones get: a thin progress line under the top bar, and the tabs at the bottom. */
export function MobileNavbar({
  groups,
  labels,
  hud,
}: {
  groups: { id: string; label: string | null; items: NavItem[] }[];
  labels: NavLabels;
  hud: HudProgress | null;
}) {
  return (
    <div className="md:hidden" data-testid="mobile-navbar">
      {hud ? <HudStrip initial={hud} /> : null}
      <BottomNav groups={groups} labels={labels} />
    </div>
  );
}
