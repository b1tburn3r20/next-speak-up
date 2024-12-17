"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyAreasPieChart } from "./PolicyAreasPieChart";
import type { CompleteLegislationStats } from "@/lib/services/legislation";

interface PolicyAreasTabsCardProps {
  stats: CompleteLegislationStats;
}

export function PolicyAreasTabsCard({ stats }: PolicyAreasTabsCardProps) {
  return (
    <Card className="w-full">
      <Tabs defaultValue="all" className="w-full ">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="sponsored">Sponsored</TabsTrigger>
          <TabsTrigger value="cosponsored">Cosponsored</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <PolicyAreasPieChart
            topPolicyAreas={stats.combined.policyAreas}
            title="Top 3 Most Supported Topics"
            description={`Total Bills: ${stats.combined.total}`}
          />
        </TabsContent>
        <TabsContent value="sponsored">
          <PolicyAreasPieChart
            topPolicyAreas={stats.sponsored.policyAreas}
            title="Top 3 Most Supported Topics (Sponsored)"
            description={`Total Bills: ${stats.sponsored.total}`}
          />
        </TabsContent>
        <TabsContent value="cosponsored">
          <PolicyAreasPieChart
            topPolicyAreas={stats.cosponsored.policyAreas}
            title="Top 3 Most Supported Topics (Cosponsored) "
            description={`Total Bills: ${stats.cosponsored.total}`}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
