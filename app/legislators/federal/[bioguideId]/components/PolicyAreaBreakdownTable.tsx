
"use client"

import { useTheme } from "next-themes"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CongressMemberPolicyAreaBreakdownRowType } from "../congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"

interface Props {
  data: CongressMemberPolicyAreaBreakdownRowType[]
}

export default function PolicyAreaBreakdownTable({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const sorted = [...data].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((s, d) => s + d.total, 0)
  const totalYes = data.reduce((acc, curr) => acc + curr.YEA, 0)
  const totalNo = data.reduce((acc, curr) => acc + curr.NAY, 0)
  const totalNotVoted = data.reduce((acc, curr) => acc + curr.NOT_VOTING + curr.PRESENT, 0)
  const averageYes = total > 0 ? Math.round((totalYes / total) * 100) : 0


  return (
    <div className="bg-background space-y-6 p-2 rounded-3xl shadow-md w-full">
      <div className="bg-background-light p-3 rounded-3xl shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Area</TableHead>
              <TableHead className="text-right">Yes</TableHead>
              <TableHead className="text-right">No</TableHead>
              <TableHead className="text-right">Avoided</TableHead>
              <TableHead className="text-right">Yes %</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, i) => {
              const yeaPct =
                row.total > 0 ? Math.round((row.YEA / row.total) * 100) : 0
              const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
              const indicatorColor = config
                ? (isDark ? config.chart_color_light : config.chart_color_light)
                : "transparent"

              return (
                <TableRow className={`${i % 2 === 0 ? "bg-muted/30" : ""}`} key={row.policyArea}>
                  <TableCell className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: indicatorColor }}
                    />
                    {row.policyArea}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                    {row.YEA}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                    {row.NAY}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.PRESENT + row.NOT_VOTING}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={yeaPct >= 50 ? "text-green-600" : "text-red-400"}>
                      {yeaPct}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {row.total}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow>
              <TableCell className="flex items-center gap-2">
              </TableCell>

              <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                {totalYes}</TableCell>

              <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                {totalNo}</TableCell>

              <TableCell className="text-right tabular-nums text-muted-foreground">
                {totalNotVoted}</TableCell>

              <TableCell className="text-right"

              >
                <div className={averageYes >= 50 ? "text-green-600" : "text-red-400"}>
                  ~{averageYes}%
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {total}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
