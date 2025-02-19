"use client";
import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { PolicyAreaInfo } from "./PolicyAreaLegendPopover";
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
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import Link from "next/link";

interface PolicyAreasPieChartProps {
  topPolicyAreas: {
    policy_area: {
      name: string | null;
    } | null;
    count: number;
  }[];
  title?: string;
  description?: string;
}

export function PolicyAreasPieChart({
  topPolicyAreas,
  title,
  description,
}: PolicyAreasPieChartProps) {
  const id = React.useMemo(() => `pie-policy-areas-${Date.now()}`, []);

  // Transform policy areas data for the chart and sort by value
  const policyData = topPolicyAreas
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((area) => ({
      name: area.policy_area?.name || "Unnamed Policy",
      value: area.count,
    }));

  // Assign colors after sorting to maintain consistency
  const coloredPolicyData = policyData.map((item, index) => ({
    ...item,
    fill: `hsl(var(--chart-${index + 1}))`,
  }));

  const totalBills = coloredPolicyData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Set activeIndex to 0 to always highlight the largest segment
  const activeIndex = 0;

  // Create chart config using the same sorted order
  const chartConfig = coloredPolicyData.reduce(
    (config, item, index) => ({
      ...config,
      [item.name]: {
        label: item.name,
        color: `hsl(var(--chart-${index + 1}))`,
      },
    }),
    {}
  ) satisfies ChartConfig;

  return (
    <Card data-chart={id} className="flex flex-col rounded-none shadow-none">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="pb-0">
        <div className="flex flex-col space-y-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-between items-start pt-4 pb-4">
        {/* Left side - Statistics */}
        <div className="space-y-6 w-1/2">
          {coloredPolicyData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-4">
              <div
                className="h-4 w-4 rounded-sm"
                style={{
                  backgroundColor: `hsl(var(--chart-${index + 1}))`,
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-start gap-2">
                  <span className="text-xl font-bold">{item.name}</span>
                  <div className="mt-1">
                    <PolicyAreaInfo policyArea={item.name} />
                  </div>
                </div>
                <span className="text-lg text-muted-foreground">
                  {item.value} bills (
                  {((item.value / totalBills) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Pie Chart */}
        <ChartContainer
          id={id}
          config={chartConfig}
          className="aspect-square w-1/2 max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={coloredPolicyData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                cx,
                cy,
                innerRadius,
                outerRadius = 0,
                startAngle,
                endAngle,
                fill,
              }: PieSectorDataItem) => (
                <g>
                  <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 10}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                  />
                  <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={outerRadius + 12}
                    outerRadius={outerRadius + 25}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                  />
                </g>
              )}
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
                          {totalBills}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Top Bills
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
      <CardFooter className="border-t text-sm text-muted-foreground underline flex items-center py-4">
        <Link href={"#"}>More</Link>
      </CardFooter>
    </Card>
  );
}
