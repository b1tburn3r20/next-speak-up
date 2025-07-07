"use client";

import * as React from "react";
import { TrendingUp, BarChart3, List } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteAction {
  action: string;
  count: number;
}

interface UserActivityChartProps {
  favoriteActions: FavoriteAction[];
}

export default function UserActivityChart({
  favoriteActions = [
    { action: "Reading", count: 186 },
    { action: "Writing", count: 305 },
    { action: "Coding", count: 237 },
    { action: "Learning", count: 173 },
    { action: "Meeting", count: 209 },
  ],
}: UserActivityChartProps) {
  const chartColors = ["#26734d", "#339966", "#66bb88", "#b3e0cc", "#e6f5ee"];

  const chartData = React.useMemo(() => {
    return favoriteActions.map((item, index) => ({
      action: item.action,
      count: item.count,
      fill: chartColors[index % chartColors.length],
    }));
  }, [favoriteActions]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Actions",
      },
    };

    favoriteActions.forEach((action, index) => {
      const key = action.action.toLowerCase().replace(/\s+/g, "-");
      config[key] = {
        label: action.action,
        color: chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [favoriteActions]);

  // Calculate total actions
  const totalActions = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  // Find the largest action for active state
  const largestAction = React.useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, current) =>
      current.count > max.count ? current : max
    );
  }, [chartData]);

  // Sort data for list view (highest to lowest)
  const sortedData = React.useMemo(() => {
    return [...chartData].sort((a, b) => b.count - a.count);
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <CardTitle>Top 10 User Actions</CardTitle>
      </CardHeader>

      <Tabs defaultValue="pie" className="w-full">
        <div className="flex justify-center pb-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pie Chart
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pie" className="mt-0">
          <CardContent className="flex-1 pb-0 h-[250px]">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="action"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalActions.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Actions
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <CardContent className="pb-0 h-[250px]">
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {sortedData.map((item, index) => {
                const percentage = ((item.count / totalActions) * 100).toFixed(
                  1
                );
                return (
                  <div
                    key={item.action}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <div>
                        <div className="font-medium">{item.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {percentage}% of total
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {largestAction && (
            <>
              Top action: {largestAction.action} ({largestAction.count})
              <TrendingUp className="h-4 w-4" />
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
