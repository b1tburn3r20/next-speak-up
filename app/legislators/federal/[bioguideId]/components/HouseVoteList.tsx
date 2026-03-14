"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CongressMemberHouseOfRepresentativesVoteType
} from "../congress-member-types"

interface Props {
  votes: CongressMemberHouseOfRepresentativesVoteType[]
}

type FilterPosition = "ALL" | "YEA" | "NAY" | "PRESENT" | "NOT_VOTING"

const POSITION_BADGE: Record<
  string,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
> = {
  YEA: { label: "Yea", variant: "default" },
  NAY: { label: "Nay", variant: "destructive" },
  PRESENT: { label: "Present", variant: "secondary" },
  NOT_VOTING: { label: "Not Voting", variant: "outline" },
}

export default function HouseVotesList({ votes }: Props) {
  const [filter, setFilter] = useState<FilterPosition>("ALL")
  const [search, setSearch] = useState("")

  const filtered = votes.filter((v) => {
    const matchPos =
      filter === "ALL" || v.votePosition === filter
    const q = search.toLowerCase()
    const matchText =
      !q ||
      v.billTitle?.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q) ||
      v.policyArea?.toLowerCase().includes(q) ||
      v.billNumber?.toLowerCase().includes(q)
    return matchPos && matchText
  })

  const counts: Record<FilterPosition, number> = {
    ALL: votes.length,
    YEA: votes.filter((v) => v.votePosition === "YEA").length,
    NAY: votes.filter((v) => v.votePosition === "NAY").length,
    PRESENT: votes.filter((v) => v.votePosition === "PRESENT").length,
    NOT_VOTING: votes.filter((v) => v.votePosition === "NOT_VOTING").length,
  }

  const tabs: { key: FilterPosition; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "YEA", label: "Yea" },
    { key: "NAY", label: "Nay" },
    { key: "PRESENT", label: "Present" },
    { key: "NOT_VOTING", label: "Not Voting" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>House Votes</CardTitle>
            <CardDescription>
              {votes.length} votes on record
            </CardDescription>
          </div>
          <Input
            placeholder="Search bills, areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterPosition)}>
          <TabsList className="w-full sm:w-auto">
            {tabs.map(({ key, label }) => (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                {label}
                <span className="text-muted-foreground text-xs tabular-nums">
                  {counts[key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Position</TableHead>
              <TableHead>Bill / Description</TableHead>
              <TableHead className="hidden md:table-cell">Policy Area</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Yea</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Nay</TableHead>
              <TableHead className="hidden xl:table-cell text-right">Roll #</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No votes match the current filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((vote) => {
                const pos =
                  POSITION_BADGE[vote.votePosition] ?? POSITION_BADGE.NOT_VOTING
                const date = new Date(vote.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                const title =
                  vote.billTitle ||
                  vote.description ||
                  `Roll #${vote.rollNumber}`

                return (
                  <TableRow key={vote.memberVoteId}>
                    <TableCell>
                      <Badge variant={pos.variant}>{pos.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium line-clamp-1">
                          {title}
                        </span>
                        {vote.billNumber && (
                          <span className="text-xs text-muted-foreground">
                            {vote.billNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {vote.policyArea}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right tabular-nums text-green-600 dark:text-green-400">
                      {vote.totals.yea}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right tabular-nums text-red-600 dark:text-red-400">
                      {vote.totals.nay}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-right tabular-nums text-muted-foreground">
                      {vote.rollNumber}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {date}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            Showing {filtered.length} of {votes.length} votes
          </p>
        )}
      </CardContent>
    </Card>
  )
}
