"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyAreasPieChart } from "./PolicyAreasPieChart";
import { PolicyAreaListView } from "./PolicyAreaCongressMemberListView";
import type { CompleteLegislationStats } from "@/lib/services/legislation";

interface PolicyAreasTabsCardProps {
  stats: CompleteLegislationStats;
}

export function PolicyAreasTabsCard({ stats }: PolicyAreasTabsCardProps) {
  return (
    <Card className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="sponsored">Sponsored</TabsTrigger>
          <TabsTrigger value="cosponsored">Cosponsored</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <PolicyAreasPieChart
                topPolicyAreas={stats.combined.policyAreas}
                title="Top 3 Most Supported Topics"
                description={`Total Bills: ${stats.combined.total}`}
              />
            </TabsContent>
            <TabsContent value="list">
              <PolicyAreaListView
                policyAreas={stats.combined.policyAreas}
                total={stats.combined.total}
                title="All Policy Areas"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="sponsored">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <PolicyAreasPieChart
                topPolicyAreas={stats.sponsored.policyAreas}
                title="Top 3 Most Supported Topics (Sponsored)"
                description={`Total Bills: ${stats.sponsored.total}`}
              />
            </TabsContent>
            <TabsContent value="list">
              <PolicyAreaListView
                policyAreas={stats.sponsored.policyAreas}
                total={stats.sponsored.total}
                title="Sponsored Policy Areas"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="cosponsored">
          <Tabs defaultValue="chart">
            <TabsList inverse className="w-full grid grid-cols-2">
              <TabsTrigger inverse value="chart">
                Chart
              </TabsTrigger>
              <TabsTrigger inverse value="list">
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <PolicyAreasPieChart
                topPolicyAreas={stats.cosponsored.policyAreas}
                title="Top 3 Most Supported Topics (Cosponsored)"
                description={`Total Bills: ${stats.cosponsored.total}`}
              />
            </TabsContent>
            <TabsContent value="list">
              <PolicyAreaListView
                policyAreas={stats.cosponsored.policyAreas}
                total={stats.cosponsored.total}
                title="Cosponsored Policy Areas"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
