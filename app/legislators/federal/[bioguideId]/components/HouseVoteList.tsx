"use client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { CongressMemberHouseOfRepresentativesVoteType } from "../congress-member-types"
import { formatIsoDate } from "@/lib/utils/StringFunctions"

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

export default function HouseVotesList({ votes, onGoToBill }: Props) {
  return (
    <div className="bg-background p-2 shadow-md rounded-3xl">
      <div className="bg-background-light p-4 shadow-md rounded-3xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Position</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead className="hidden md:table-cell">Policy Area</TableHead>
              <TableHead className="">Date</TableHead>
              <TableHead className="w-10"></TableHead>
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
                    {/* Badge only — no button here */}
                    <TableCell>
                      <Badge variant={pos.variant}>{pos.label}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium max-w-100 whitespace-pre-wrap">
                          {title}
                        </span>
                        {vote.billNumber && (
                          <span className="text-xs text-muted-foreground">
                            {vote.nameId}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {vote.policyArea}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {formatIsoDate(vote.date, false)}
                    </TableCell>

                    {/* Compact action — icon button, no label needed */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onGoToBill?.(vote)}
                        aria-label="Go to bill"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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
      </div>
    </div>
  )
}
