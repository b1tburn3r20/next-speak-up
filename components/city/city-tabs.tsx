"use client";

import { SectionTabs, type SectionTab } from "@/components/app/section-tabs";

export type CityTab = SectionTab;

/** A city's deeper sections as tabs. See `SectionTabs`. */
export function CityTabs({ tabs }: { tabs: CityTab[] }) {
  return <SectionTabs tabs={tabs} testId="city-tabs" tabTestId="city-tab" />;
}
