"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SectionTab = { id: string; label: string; content: ReactNode };

/**
 * A page's deeper sections side by side, one open at a time, so the page stays short on a phone. Every
 * tab's content is in the page's HTML, hidden until chosen, so search engines and find-in-page see it.
 */
export function SectionTabs({ tabs, testId = "section-tabs", tabTestId = "tab" }: { tabs: SectionTab[]; testId?: string; tabTestId?: string }) {
  if (tabs.length === 0) return null;
  return (
    <Tabs defaultValue={tabs[0].id} className="gap-3" data-testid={testId}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="w-full min-w-max sm:w-fit">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="min-h-10 px-3" data-testid={`${tabTestId}-${tab.id}`}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} forceMount className="data-[state=inactive]:hidden">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
