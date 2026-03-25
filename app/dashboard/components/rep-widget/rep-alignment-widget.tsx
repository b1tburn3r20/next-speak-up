"use client"
import * as React from "react"
import { Check, ExternalLink, Loader, X } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Label, Pie, PieChart, Sector } from "recharts"
import { MissingDistrictModal } from "../user-personalized-dashboard-representative-widget";
import {
  RepresentationMetrics,
  RepresentationBill,
} from "@/lib/services/dashboard/user-personalized-dashboard";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/app/stores/useAppStore";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SliceKey = "AGREE" | "DISAGREE"
interface ChartSlice {
  slice: SliceKey
  count: number
  fill: string
}
const chartConfig = {
  count: { label: "Bills" },
  AGREE: { label: "Agreed", color: "var(--chart-4)" },
  DISAGREE: { label: "Disagreed", color: "var(--chart-6)" },
} satisfies ChartConfig

const SLICE_ORDER: SliceKey[] = ["AGREE", "DISAGREE"]

const VOTE_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  YEA: { label: "Yea", variant: "default" },
  NAY: { label: "Nay", variant: "destructive" },
  PRESENT: { label: "Present", variant: "outline" },
  NOT_VOTING: { label: "Not Voting", variant: "secondary" },
}
const POSITION_BADGE: Record<string, { label: string; variant: string }> = {
  YEA: { label: "Yes", variant: "green" },
  NAY: { label: "No", variant: "destructive" },
  PRESENT: { label: "Avoided", variant: "muted" },
  NOT_VOTING: { label: "Avoided", variant: "muted" },
}

function BillListModal({
  open,
  onClose,
  slice,
  bills,
}: {
  open: boolean
  onClose: () => void
  slice: SliceKey | null
  bills: RepresentationBill[]
}) {
  if (!slice) return null
  const isMobile = useAppStore((f) => f.isMobile)
  const config = chartConfig[slice]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="lg:min-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </DialogTitle>
          <DialogDescription>
            {bills.length === 100
              ? "Showing first 100 bills"
              : `${bills.length} bill${bills.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-background-light rounded-2xl overflow-hidden flex-1 min-h-0">
          <ScrollArea>
            <div className="max-h-[60vh]">
              <Table className="w-full table-fixed md:table-auto">
                <TableHeader className="bg-background-light sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="py-2 text-xs">Bill</TableHead>
                    <TableHead className="w-16 md:w-20 py-2 text-xs">You</TableHead>
                    <TableHead className="w-16 md:w-20 py-2 text-xs">Rep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-xs text-muted-foreground"
                      >
                        No bills in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map((bill, i) => {
                      const repBadge = VOTE_BADGE[bill.repVote] ?? { label: bill.repVote, variant: "outline" as const }

                      const pos = POSITION_BADGE[bill.userVote] ?? POSITION_BADGE.NOT_VOTING
                      const rpos = POSITION_BADGE[bill.repVote] ?? POSITION_BADGE.NOT_VOTING
                      return (
                        <TableRow
                          key={bill.name_id}
                          className={i % 2 === 0 ? "bg-muted/30" : ""}
                        >
                          <TableCell>

                            <Link href={`/bills/${bill?.name_id}`}>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                aria-label="Go to bill"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>

                          <TableCell className="py-1.5 min-w-0">
                            <div className="text-xs font-medium line-clamp-2 wrap-break-word md:max-w-80">
                              {bill.title ?? bill.name_id}
                            </div>
                            <div className="text-xs text-muted-foreground truncate font-mono">
                              {bill.name_id}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant={pos.variant} className="text-xs px-1.5 py-0">
                              {isMobile ? (
                                <>
                                  {pos.label === "Avoided" ? <ExclamationTriangleIcon /> : (pos.label === "Yes" ? <Check /> : <X />)}
                                </>
                              ) : (
                                <>
                                  {pos?.label}
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant={rpos.variant} className="text-xs px-1.5 py-0">
                              {isMobile ? (
                                <>
                                  {rpos.label === "Avoided" ? <ExclamationTriangleIcon /> : (rpos.label === "Yes" ? <Check /> : <X />)}
                                </>
                              ) : (
                                <>
                                  {rpos?.label}
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
const UserRepAlignmentWidget = () => {
  const id = "rep-alignment-pie"
  const [fetching, setFetching] = useState(false)
  const [data, setData] = useState<null | RepresentationMetrics>(null)
  const [error, setError] = useState<string>("")
  const [activeSlice, setActiveSlice] = useState<SliceKey>(SLICE_ORDER[0])
  const [modalSlice, setModalSlice] = useState<SliceKey | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true)
      try {
        const response = await fetch("/api/dashboard/widgets/user-rep-comparison")
        if (!response.ok) {
          handleError(response)
          return
        }
        const json = await response.json()
        setData(json.data)
      } catch (error) {
        console.error("Error fetching representative data:", error)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  const handleError = (response: Response) => {
    setError(response.status.toString())
  }

  const chartData = useMemo<ChartSlice[]>(() => {
    if (!data) return []
    return SLICE_ORDER.map((key) => ({
      slice: key,
      count: data.summary[key],
      fill: chartConfig[key].color,
    }))
  }, [data])

  const activeIndex = useMemo(
    () => chartData.findIndex((d) => d.slice === activeSlice),
    [chartData, activeSlice]
  )

  const totalBills = useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData]
  )

  const renderActiveShape = useCallback(
    ({ index, outerRadius = 0, ...props }: any) => {
      if (index === activeIndex) {
        return (
          <g>
            <Sector {...props} outerRadius={outerRadius + 10} />
            <Sector
              {...props}
              outerRadius={outerRadius + 25}
              innerRadius={outerRadius + 12}
            />
          </g>
        )
      }
      return <Sector {...props} outerRadius={outerRadius} />
    },
    [activeIndex]
  )

  const handleSliceClick = useCallback((sliceKey: SliceKey) => {
    setModalSlice(sliceKey)
    setModalOpen(true)
  }, [])

  if (fetching) return (
    <div className="min-h-120 w-60 bg-background-light shadow-md rounded-2xl p-4 flex items-center justify-center">
      <Loader className="animate-spin" size={32} />
    </div>
  )

  if (error === "404") return <MissingDistrictModal />
  if (error) return null
  if (!data) return null

  const agreePercent = totalBills > 0
    ? Math.round((data.summary.AGREE / totalBills) * 100)
    : 0

  return (
    <>
      <Card data-chart={id} className="flex flex-col bg-background-light shadow-md border-none">
        <ChartStyle id={id} config={chartConfig} />
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Your Rep Alignment</CardTitle>
            <CardDescription>
              How often you and your representative vote the same way
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 justify-center pb-0">
          {data?.bills?.AGREE?.length === 0 && data?.bills?.DISAGREE?.length === 0 ? (
            <div

              className="mx-auto aspect-square w-full max-w-75"
            >No votes to compare yet, go choose Yes or No on some bills and come back to see how you align.</div>
          ) : (
            <ChartContainer
              id={id}
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-75"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="slice" />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="slice"
                  innerRadius={60}
                  strokeWidth={5}
                  activeShape={renderActiveShape}
                  activeIndex={activeIndex}
                  onClick={(entry) => {
                    const key = entry?.slice as SliceKey
                    setActiveSlice(key)
                    handleSliceClick(key)
                  }}
                  className="cursor-pointer"
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
                              {agreePercent}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs"
                            >
                              aligned
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

          )}
        </CardContent>

        <div className="flex flex-wrap justify-center gap-2 px-4 pb-4 pt-2">
          {chartData.map((d) => (
            <button
              key={d.slice}
              onClick={() => {
                setActiveSlice(d.slice)
                handleSliceClick(d.slice)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted data-[active=true]:bg-muted"
              data-active={activeSlice === d.slice}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.fill }}
              />
              {chartConfig[d.slice].label}
              <span className="font-semibold">{d.count}</span>
            </button>
          ))}
        </div>
      </Card>

      <BillListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slice={modalSlice}
        bills={modalSlice ? data.bills[modalSlice] : []}
      />
    </>
  )
}

export default UserRepAlignmentWidget
