"use client"

import { Cell, Pie, PieChart } from "recharts"
import { useTheme } from "next-themes"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CongressMemberSponsorPolicyAreaBreakdownRowType } from "../congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"
import { useCongressMemberStore } from "@/app/stores/congress-member-store"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  data: CongressMemberSponsorPolicyAreaBreakdownRowType[]
}

const TAB_LABELS = {
  combined: "Combined",
  sponsored: "Sponsored",
  cosponsored: "Co-Sponsored",
} as const

type TabKey = keyof typeof TAB_LABELS

export default function SponsorPolicyAreaBreakdown({ data }: Props) {

  const congressMemberSponsorLegislationType = useCongressMemberStore((f) => f.congressMemberSponsorLegislationType)
  const setCongressMemberSponsorLegislationType = useCongressMemberStore((f) => f.setCongressMemberSponsorLegislationType)
  const setSelectedSponsorPolicyArea = useCongressMemberStore((f) => f.setSelectedSponsorPolicyArea)
  const activeKey = congressMemberSponsorLegislationType as TabKey

  const sorted = [...data].sort((a, b) => b[activeKey] - a[activeKey])
  const total = sorted.reduce((s, d) => s + d[activeKey], 0)

  const chartConfig = sorted.reduce<ChartConfig>((cfg, row) => {
    const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
    cfg[row.policyArea] = {
      label: row.policyArea,
      color: config ? config.chart_color_light : "hsl(var(--muted))",
    }
    return cfg
  }, {})

  const chartData = sorted
    .filter((row) => row[activeKey] > 0)
    .map((row) => {
      const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
      return {
        name: row.policyArea,
        value: row[activeKey],
        fill: config ? config.chart_color_light : "hsl(var(--muted))",
      }
    })

  return (
    <div className="bg-background space-y-6 p-2 rounded-3xl shadow-md h-full w-full">
      <div className="bg-background-light p-3 rounded-3xl shadow-md h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
          <div>
            <div className="font-normal">Sponsorship Breakdown</div>
            <div className="text-sm text-muted-foreground">
              {sorted.filter((r) => r[activeKey] > 0).length} policy areas · {total} bills
            </div>
          </div>
          <Tabs
            value={activeKey}
            onValueChange={(v) =>
              setCongressMemberSponsorLegislationType(v as TabKey)
            }
          >
            <TabsList>
              {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {TAB_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <ScrollArea className="mt-4 h-[20vh] pr-2">
            <div className="flex flex-col gap-4">
              {sorted
                .filter((row) => row[activeKey] > 0)
                .map((row, i) => {
                  const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
                  const indicatorColor = config ? config.chart_color_light : "transparent"
                  return (
                    <div onClick={() => setSelectedSponsorPolicyArea(row.policyArea)} className="cursor-pointer flex gap-2 items-center hover:bg-background/10 rounded-lg" key={i}>
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: indicatorColor }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {row.policyArea}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto pl-4">
                        {row[activeKey]}
                      </span>
                    </div>
                  )
                })}
            </div>
          </ScrollArea>

          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-70">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-medium text-foreground">{name}</span>
                        <span className="text-muted-foreground">
                          {value} bills &mdash;{" "}
                          {total > 0
                            ? ((Number(value) / total) * 100).toFixed(1)
                            : "0.0"}
                          %
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
