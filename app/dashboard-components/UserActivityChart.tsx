"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
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

interface FavoriteAction {
  action: string;
  count: number;
}

interface UserActivityChartProps {
  favoriteActions: FavoriteAction[];
}

export function UserActivityChart({ favoriteActions }: UserActivityChartProps) {
  const chartColors = ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe", "#eff6ff"];

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

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Activity Chart - Donut</CardTitle>
        <CardDescription> Top Actions Distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {largestAction && (
            <>
              Top action: {largestAction.action} ({largestAction.count})
              <TrendingUp className="h-4 w-4" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Activity distribution
        </div>
      </CardFooter>
    </Card>
  );
}
