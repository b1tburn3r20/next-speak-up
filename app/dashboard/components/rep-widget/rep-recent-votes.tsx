"use client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ExternalLink, X } from "lucide-react"
import { CongressMemberHouseOfRepresentativesVoteType } from "@/app/legislators/federal/[bioguideId]/congress-member-types"
import { formatIsoDate } from "@/lib/utils/StringFunctions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { useAppStore } from "@/app/stores/useAppStore"
import Link from "next/link"

interface Props {
  votes: CongressMemberHouseOfRepresentativesVoteType[]
  bioguideId: string
}

const POSITION_BADGE: Record<string, { label: string; variant: string }> = {
  YEA: { label: "Yes", variant: "green" },
  NAY: { label: "No", variant: "destructive" },
  PRESENT: { label: "Avoided", variant: "muted" },
  NOT_VOTING: { label: "Avoided", variant: "muted" },
}

export default function RepRecentVotesWidget({ votes, bioguideId }: Props) {
  const isMobile = useAppStore((f) => f.isMobile)
  return (
    <div className="bg-background-light shadow-md rounded-2xl p-3 w-full overflow-hidden">
      <ScrollArea>
        <div className="max-h-100">
          <Table className="w-full table-fixed md:table-auto">
            <TableHeader className="bg-background-light sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-8 py-2" />
                <TableHead className="w-14 md:w-16 py-2 text-xs">Position</TableHead>
                <TableHead className="py-2 text-xs">Bill</TableHead>
                <TableHead className="hidden md:table-cell py-2 text-xs">Area</TableHead>
                <TableHead className="w-16 md:w-auto py-2 text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-xs text-muted-foreground">
                    No votes match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                votes.map((vote, i) => {
                  const pos = POSITION_BADGE[vote.votePosition] ?? POSITION_BADGE.NOT_VOTING
                  const title = vote.billTitle || `Roll #${vote.rollNumber}`
                  return (
                    <TableRow key={vote.memberVoteId} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <TableCell className="py-1.5 text-right">
                        <Link target="_blank" href={`/bills/${vote.nameId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            aria-label="Go to bill"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
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
                      <TableCell className="py-1.5 min-w-0">
                        <div className="text-xs font-medium line-clamp-2 break-words md:max-w-64">{title}</div>
                        {vote.billNumber && (
                          <div className="text-xs text-muted-foreground truncate">{vote.nameId}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-1.5">
                        <span className="text-xs text-muted-foreground">{vote.policyArea}</span>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground md:whitespace-nowrap">
                        {formatIsoDate(vote.date, false)}
                      </TableCell>

                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      <Link href={`/legislators/federal/${bioguideId}`}>
        <Button className="w-full mt-3 h-8 text-sm">View more</Button>
      </Link>
    </div>
  )
}
