"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CongressMemberSponsorPolicyAreaBreakdownRowType } from "../congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"
import { useCongressMemberStore } from "@/app/stores/congress-member-store"
import { cn } from "@/lib/utils"

interface Props {
  data: CongressMemberSponsorPolicyAreaBreakdownRowType[]
}

export default function SponsorPolicyAreaBreakdownTable({ data }: Props) {
  const {
    congressMemberSponsorLegislationType,
    selectedSponsorPolicyArea,
    setSelectedSponsorPolicyArea,
  } = useCongressMemberStore()

  const activeKey = congressMemberSponsorLegislationType

  const sorted = [...data]
    .filter((row) => row[activeKey] > 0)
    .sort((a, b) => b[activeKey] - a[activeKey])

  const total = sorted.reduce((s, d) => s + d[activeKey], 0)

  function handleRowClick(policyArea: string) {
    setSelectedSponsorPolicyArea(
      selectedSponsorPolicyArea === policyArea ? null : policyArea
    )
  }

  return (
    <div className="bg-background p-2 shadow-md rounded-3xl min-w-0 overflow-x-auto">
      <div className="bg-background-light p-4 shadow-md rounded-3xl min-w-0 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Policy Area</TableHead>
                <TableHead className="w-24 text-right">Sponsored</TableHead>
                <TableHead className="w-30 text-right">Co-Sponsored</TableHead>
                <TableHead className="w-24 text-right">Combined</TableHead>
                <TableHead className="w-20 text-right">Share</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No data available.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row, i) => {
                  const config = PolicyAreas[row.policyArea as keyof typeof PolicyAreas]
                  const color = config ? config.chart_color_light : "hsl(var(--muted))"
                  const share = total > 0 ? ((row[activeKey] / total) * 100).toFixed(1) : "0.0"
                  const isSelected = selectedSponsorPolicyArea === row.policyArea

                  return (
                    <TableRow
                      key={row.policyArea}
                      onClick={() => handleRowClick(row.policyArea)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15 ring-1 ring-inset ring-primary/30"
                          : i % 2 === 0
                            ? "bg-muted/30 hover:bg-muted/50"
                            : "hover:bg-muted/30"
                      )}
                    >
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium">{row.policyArea}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {row.sponsored}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {row.cosponsored}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {row.combined}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {share}%
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {sorted.length > 0 && (
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Showing {sorted.length} policy areas · {total} total bills
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
