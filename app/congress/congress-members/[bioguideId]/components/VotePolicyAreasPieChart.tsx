import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { PolicyAreaInfo } from "./PolicyAreaLegendPopover";
import { VotePolicyHoverCard } from "./VotePolicyHoverCard";
import {
  Card,
  CardContent,
  CardDescription,
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
import type { PolicyAreaVoteCount } from "@/lib/services/congress_two";
import { useMemo } from "react";

interface CongressMemberVotePiechartProps {
  policyAreaVotes: PolicyAreaVoteCount[];
  title: string;
  description: string;
  voteType: "all" | "yea" | "nay" | "notVoting";
}

export default function CongressMemberVotePiechart({
  policyAreaVotes,
  title,
  description,
  voteType,
}: CongressMemberVotePiechartProps) {
  const id = useMemo(
    () => `pie-vote-policy-${voteType}-${Date.now()}`,
    [voteType]
  );

  // Get top 3 policy areas by count
  const policyData = policyAreaVotes
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((area) => ({
      name: area.policyArea,
      value: area.count,
      percentage: area.percentage,
      legislation: area.legislation, // Include legislation data
    }));

  // Assign colors based on vote type
  const getColorScheme = (index: number) => {
    switch (voteType) {
      case "yea":
        return `hsl(var(--chart-${index + 1}))`;
      case "nay":
        return `hsl(var(--chart-${index + 1}))`;
      case "notVoting":
        return `hsl(var(--chart-${index + 1}))`;
      default:
        return `hsl(var(--chart-${index + 1}))`;
    }
  };

  const coloredPolicyData = policyData.map((item, index) => ({
    ...item,
    fill: getColorScheme(index),
  }));

  const totalVotes = coloredPolicyData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Always highlight the largest segment
  const activeIndex = 0;

  // Create chart config using the same sorted order
  const chartConfig = coloredPolicyData.reduce(
    (config, item, index) => ({
      ...config,
      [item.name]: {
        label: item.name,
        color: getColorScheme(index),
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
      <CardContent className="flex flex-1 justify-between items-start pt-4">
        {/* Left side - Statistics */}
        <div className="space-y-6 w-1/2">
          {coloredPolicyData.map((item, index) => (
            <VotePolicyHoverCard
              key={item.name}
              policyArea={item.name}
              legislation={item.legislation} // Pass legislation data to hover card
            >
              <div className="flex items-center gap-4 cursor-pointer">
                <div
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: getColorScheme(index) }}
                />
                <div className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="text-xl font-bold">{item.name}</span>
                    <div className="mt-1">
                      <PolicyAreaInfo policyArea={item.name} />
                    </div>
                  </div>
                  <span className="text-lg text-muted-foreground">
                    {item.value} votes ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </VotePolicyHoverCard>
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
                          {totalVotes}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Votes
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
    </Card>
  );
}
