"use client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { CongressMemberHouseOfRepresentativesVoteType } from "@/app/legislators/federal/[bioguideId]/congress-member-types"
import { formatIsoDate } from "@/lib/utils/StringFunctions"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  votes: CongressMemberHouseOfRepresentativesVoteType[]
  onGoToBill?: (vote: CongressMemberHouseOfRepresentativesVoteType) => void
}

const POSITION_BADGE: Record<string, { label: string; variant: string }> = {
  YEA: { label: "Yes", variant: "green" },
  NAY: { label: "No", variant: "destructive" },
  PRESENT: { label: "Avoided", variant: "muted" },
  NOT_VOTING: { label: "Avoided", variant: "muted" },
}

export default function RepRecentVotesWidget({ votes, onGoToBill }: Props) {
  return (
    <div className="bg-background-light shadow-md rounded-2xl p-3">
      <ScrollArea>
        <div className="max-h-100">
          <Table>
            <TableHeader className="bg-background-light sticky top-0 z-10" >
              <TableRow  >
                <TableHead className="w-16 py-2 text-xs">Position</TableHead>
                <TableHead className="py-2 text-xs">Bill</TableHead>
                <TableHead className="hidden md:table-cell py-2 text-xs">Area</TableHead>
                <TableHead className="py-2 text-xs">Date</TableHead>
                <TableHead className="w-8 py-2" />
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
                      <TableCell className="py-1.5">
                        <Badge variant={pos.variant} className="text-xs px-1.5 py-0">{pos.label}</Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="text-xs font-medium line-clamp-2 max-w-64">{title}</div>
                        {vote.billNumber && (
                          <div className="text-xs text-muted-foreground">{vote.nameId}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-1.5">
                        <span className="text-xs text-muted-foreground">{vote.policyArea}</span>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatIsoDate(vote.date, false)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => onGoToBill?.(vote)}
                          aria-label="Go to bill"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      <Button className="w-full mt-3 h-8 text-sm">View more</Button>
    </div>
  )
}
