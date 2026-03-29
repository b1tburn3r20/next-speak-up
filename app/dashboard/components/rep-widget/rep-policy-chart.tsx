"use client"
import { Cell, Pie, PieChart } from "recharts"
import { useTheme } from "next-themes"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CongressMemberPolicyAreaBreakdownRowType } from "@/app/legislators/federal/[bioguideId]/congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"

interface Props {
  data: CongressMemberPolicyAreaBreakdownRowType[]
}

export default function PolicyAreaWidget({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)

  const chartConfig = sorted.reduce<ChartConfig>((cfg, row) => {
    const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
    cfg[row.policyArea] = {
      label: row.policyArea,
      color: config ? config.chart_color_light : "hsl(var(--muted))",
    }
    return cfg
  }, {})

  const chartData = sorted.map((row) => {
    const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
    return {
      name: row.policyArea,
      value: row.total,
      fill: config ? config.chart_color_light : "hsl(var(--muted))",
    }
  })

  return (
    <div className="bg-background-light h-full p-3 rounded-2xl shadow-md">
      <div className="text-sm font-medium">Yes Vote Breakdown</div>
      <div className="text-xs text-muted-foreground mb-2">
        {sorted.length} areas · {total} votes
      </div>
      <div className="flex gap-2 items-center">
        <div className="space-y-2">
          {sorted.slice(0, 5).map((row, i) => {
            const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
            const color = config ? config.chart_color_light : "transparent"
            return (
              <div className="flex gap-1.5 items-center" key={i}>
                <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground truncate max-w-[90px]">{row.policyArea}</span>
              </div>
            )
          })}
        </div>
        <ChartContainer config={chartConfig} className="aspect-square h-36">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="text-muted-foreground">
                        {value} · {((Number(value) / total) * 100).toFixed(1)}%
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
              innerRadius={40}
              outerRadius={62}
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
  )
}
