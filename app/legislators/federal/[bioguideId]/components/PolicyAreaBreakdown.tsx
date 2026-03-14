"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CongressMemberPolicyAreaBreakdownRowType } from "../congress-member-types"

interface Props {
  data: CongressMemberPolicyAreaBreakdownRowType[]
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1) / 0.65)",
  "hsl(var(--chart-2) / 0.65)",
  "hsl(var(--chart-3) / 0.65)",
  "hsl(var(--chart-4) / 0.65)",
  "hsl(var(--chart-5) / 0.65)",
]

export default function PolicyAreaBreakdown({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)

  const chartConfig = sorted.reduce<ChartConfig>((cfg, row, i) => {
    cfg[row.policyArea] = {
      label: row.policyArea,
      color: COLORS[i % COLORS.length],
    }
    return cfg
  }, {})

  const chartData = sorted.map((row, i) => ({
    name: row.policyArea,
    value: row.total,
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Area Breakdown</CardTitle>
        <CardDescription>
          {sorted.length} policy areas · {total} total votes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pie chart */}
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
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
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Area</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Yea</TableHead>
              <TableHead className="text-right">Nay</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Not Voting</TableHead>
              <TableHead className="text-right">Yea %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, i) => {
              const yeaPct =
                row.total > 0 ? Math.round((row.yes / row.total) * 100) : 0
              return (
                <TableRow key={row.policyArea}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm">{row.policyArea}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {row.total}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                    {row.yes}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                    {row.no}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-yellow-600 dark:text-yellow-400">
                    {row.present}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.notVoting}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={yeaPct >= 50 ? "default" : "secondary"}>
                      {yeaPct}%
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
