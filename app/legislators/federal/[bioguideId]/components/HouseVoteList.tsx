"use client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { CongressMemberHouseOfRepresentativesVoteType } from "../congress-member-types"
import { formatIsoDate } from "@/lib/utils/StringFunctions"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  votes: CongressMemberHouseOfRepresentativesVoteType[]
}

const POSITION_BADGE: Record<string, { label: string; variant: string }> = {
  YEA: { label: "Yes", variant: "green" },
  NAY: { label: "No", variant: "destructive" },
  PRESENT: { label: "Avoided", variant: "muted" },
  NOT_VOTING: { label: "Avoided", variant: "muted" },
}


export default function HouseVotesList({ votes }: Props) {
  return (
    <div className="bg-background p-2 shadow-md rounded-3xl min-w-0 overflow-x-auto">
      <div className="bg-background-light p-4 shadow-md rounded-3xl min-w-0 overflow-hidden">
        <ScrollArea className="w-full relative overflow-x-auto h-[50vh]">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 bg-background-light">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-24">Position</TableHead>
                <TableHead>Bill</TableHead>
                <TableHead className="hidden md:table-cell w-36">Policy Area</TableHead>
                <TableHead className="hidden sm:table-cell w-24">Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {votes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No votes match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                votes.map((vote, i) => {
                  const pos = POSITION_BADGE[vote.votePosition] ?? POSITION_BADGE.NOT_VOTING
                  const title = vote.billTitle || `Roll #${vote.rollNumber}`

                  return (
                    <TableRow
                      key={vote.memberVoteId}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                    >
                      <TableCell className="text-right align-top pt-3">
                        <Link target="_blank" href={`/bills/${vote?.nameId}`}>

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
                        <Badge variant={pos.variant}>{pos.label}</Badge>
                      </TableCell>

                      <TableCell className="align-top pt-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium break-words line-clamp-3 max-w-[200px] sm:max-w-xs md:max-w-sm xl:max-w-none">
                            {title}
                          </span>
                          {vote.billNumber && (
                            <span className="text-xs text-muted-foreground">
                              {vote.nameId}
                            </span>
                          )}
                          {/* Show date inline on mobile where the date column is hidden */}
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatIsoDate(vote.date, false)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell align-top pt-3">
                        <span className="text-sm text-muted-foreground">
                          {vote.policyArea}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground whitespace-nowrap align-top pt-3">
                        {formatIsoDate(vote.date, false)}
                      </TableCell>

                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {votes.length > 0 && (
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Showing {votes.length} of {votes.length} votes
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
