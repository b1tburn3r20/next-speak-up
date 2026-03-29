"use client"

import { Cell, Pie, PieChart } from "recharts"
import { useTheme } from "next-themes"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CongressMemberPolicyAreaBreakdownRowType } from "../congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"

interface Props {
  data: CongressMemberPolicyAreaBreakdownRowType[]
}

export default function PolicyAreaBreakdown({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const sorted = [...data].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)

  const chartConfig = sorted.reduce<ChartConfig>((cfg, row) => {
    const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
    cfg[row.policyArea] = {
      label: row.policyArea,
      color: config
        ? (isDark ? config.chart_color_light : config.chart_color_light)
        : "hsl(var(--muted))",
    }
    return cfg
  }, {})

  const chartData = sorted.map((row) => {
    const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
    return {
      name: row.policyArea,
      value: row.total,
      fill: config
        ? (isDark ? config.chart_color_light : config.chart_color_light)
        : "hsl(var(--muted))",
    }
  })

  return (
    <div className="bg-background space-y-6 p-2 rounded-3xl shadow-md h-fit w-full">
      <div className="bg-background-light p-3 rounded-3xl shadow-md h-full">
        <div className="font-normal">Yes Vote Breakdown</div>
        <div className="text-sm text-muted-foreground">
          {sorted.length} policy areas · {total} tracked total votes by CoolBills
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="mt-4 space-y-4">
            {sorted?.slice(0, 7).map((row, i) => {
              const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
              const indicatorColor = config
                ? (isDark ? config.chart_color_light : config.chart_color_light)
                : "transparent"

              return (
                <div className="flex gap-2 items-center" key={i}>
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: indicatorColor }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {row.policyArea}
                  </span>
                </div>)
            })}
          </div>
          <ChartContainer
            config={chartConfig}

            className="mx-auto aspect-square h-70"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-medium text-foreground">{name}</span>
                        <span className="text-muted-foreground">
                          {value} votes &mdash; {((Number(value) / total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={110}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>

    </div>
  )
}
