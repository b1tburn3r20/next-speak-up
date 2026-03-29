"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useCongressMemberStore } from "@/app/stores/congress-member-store"
import { CongressMemberSponsorBillType } from "../congress-member-types"
import { PolicyAreas } from "@/lib/constants/policy-areas"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  bills: CongressMemberSponsorBillType[]
}

const SPONSOR_TYPE_BADGE: Record<string, { label: string; variant: string }> = {
  sponsored: { label: "Sponsored", variant: "sky" },
  cosponsored: { label: "Co-Sponsored", variant: "orange" },
}

const TAB_LABELS = {
  combined: "Combined",
  sponsored: "Sponsored",
  cosponsored: "Co-Sponsored",
} as const

type TabKey = keyof typeof TAB_LABELS

export default function SponsorBillsTable({ bills }: Props) {
  const congressMemberSponsorLegislationType = useCongressMemberStore((f) => f.congressMemberSponsorLegislationType)
  const setSelectedSponsorPolicyArea = useCongressMemberStore((f) => f.setSelectedSponsorPolicyArea)
  const selectedSponsorPolicyArea = useCongressMemberStore((f) => f.selectedSponsorPolicyArea)
  const setCongressMemberSponsorLegislationType = useCongressMemberStore((f) => f.setCongressMemberSponsorLegislationType)
  const activeMode = congressMemberSponsorLegislationType

  const filtered = bills.filter((bill) => {
    const modeMatch =
      activeMode === "combined" ||
      bill.sponsorType === activeMode
    const areaMatch =
      !selectedSponsorPolicyArea ||
      bill.policyArea === selectedSponsorPolicyArea
    return modeMatch && areaMatch
  })


  const handleRowClick = (bill: any) => {
    if (selectedSponsorPolicyArea === bill.policyArea) {
      setSelectedSponsorPolicyArea(null)
    } else {
      setSelectedSponsorPolicyArea(bill.policyArea)
    }
  }

  return (
    <div className="bg-background p-2 shadow-md rounded-3xl min-w-0 overflow-x-auto">
      <div className="bg-background-light p-4 shadow-md rounded-3xl min-w-0 overflow-hidden">


        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-normal truncate capitalize">
              {activeMode}  {selectedSponsorPolicyArea ?? ""}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {filtered.length} bill{filtered.length !== 1 ? "s" : ""}
              </p>
              {selectedSponsorPolicyArea && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-5 px-1"
                  onClick={() => setSelectedSponsorPolicyArea(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Tabs
            value={activeMode}
            onValueChange={(v) =>
              setCongressMemberSponsorLegislationType(v as TabKey)
            }
          >
            <TabsList className="h-8">
              {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
                <TabsTrigger key={key} value={key} className="text-xs px-2 h-6">
                  {TAB_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="w-full overflow-x-auto relative h-[80vh]">
          <Table className="w-full">
            <TableHeader className="bg-background-light sticky top-0">
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-24 sm:w-28">Type</TableHead>
                <TableHead>Bill</TableHead>
                <TableHead className="hidden md:table-cell w-44">Policy Area</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No bills match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((bill, i) => {
                  const badge = SPONSOR_TYPE_BADGE[bill.sponsorType]
                  const config = PolicyAreas[bill.policyArea as keyof typeof PolicyAreas]
                  const color = config ? config.chart_color_light : "hsl(var(--muted))"

                  return (
                    <TableRow
                      key={`${bill.nameId}-${bill.sponsorType}`}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <TableCell className="text-right align-top pt-3">
                        <Link href={`/bills/${bill.nameId}`} target="_blank">
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

                      <TableCell className="align-top pt-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>

                      <TableCell className="align-top pt-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium wrap-break-words line-clamp-3 min-w-0">
                            {bill.title}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {bill.nameId}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden cursor-pointer md:table-cell align-top pt-3" onClick={() => handleRowClick(bill)}>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {bill.policyArea}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {filtered.length > 0 && (
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Showing {filtered.length} bill{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
