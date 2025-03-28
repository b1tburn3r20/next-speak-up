"use client";
// CongressMemberVotesCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { congressVotesService } from "@/lib/services/congress_two";
import { useState } from "react";
import { VoteSearchBar } from "./Votes/VoteSearchBar";
import { VoteResultsList } from "./Votes/VoteSearchList";

const HIGHLIGHT_COLORS = [
  "bg-pink-200",
  "bg-teal-200",
  "bg-yellow-200",
  "bg-purple-200",
];

interface CongressMemberVotesCardProps {
  initialVotes: RecentVote[];
  bioguideId: string;
  firstName: string;
  lastName: string;
}

export interface RecentVote {
  date: Date;
  billName: string | null;
  billTitle: string | null;
  votePosition: string;
  billNameId: string | null;
  policyArea?: string | null;
}

interface SearchTerm {
  term: string;
  color: string;
}

export function CongressMemberVotesCard({
  initialVotes,
  bioguideId,
  firstName,
  lastName,
}: CongressMemberVotesCardProps) {
  const [votes, setVotes] = useState<RecentVote[]>(initialVotes);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 10;

  const handleSearch = async (query: string, tags: string[]) => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        bioguideId,
        page: "1",
        limit: ITEMS_PER_PAGE.toString(),
      });

      // Add optional parameters if they exist
      if (query) {
        params.append("query", query);
      }
      tags.forEach((tag) => {
        params.append("tags[]", tag);
      });

      const response = await fetch(
        `/api/congress/congress-members/vote-search/page?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch votes");
      }

      const searchResults = await response.json();

      setVotes(searchResults.votes);
      setTotal(searchResults.total);
      setHasMore(searchResults.total > ITEMS_PER_PAGE);
      setPage(1);
      setCurrentQuery(query);
      setCurrentTags(tags);
    } catch (error) {
      console.error("Error searching votes:", error);
    }
    setIsLoading(false);
  };

  // Updated loadMore function for CongressMemberVotesCard
  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;

      // Build query parameters
      const params = new URLSearchParams({
        bioguideId,
        page: nextPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      // Add optional parameters if they exist
      if (currentQuery) {
        params.append("query", currentQuery);
      }
      currentTags.forEach((tag) => {
        params.append("tags[]", tag);
      });

      const response = await fetch(
        `/api/congress/congress-members/vote-search/page?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch more votes");
      }

      const moreVotes = await response.json();

      if (moreVotes.votes.length > 0) {
        setVotes((prev) => [...prev, ...moreVotes.votes]);
        setHasMore(moreVotes.votes.length === ITEMS_PER_PAGE);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more votes:", error);
    }
    setIsLoading(false);
  };

  const searchTerms: SearchTerm[] = [
    ...(currentQuery
      ? [{ term: currentQuery, color: HIGHLIGHT_COLORS[0] }]
      : []),
    ...currentTags.map((tag, index) => ({
      term: tag,
      color: HIGHLIGHT_COLORS[(index + 1) % HIGHLIGHT_COLORS.length],
    })),
  ];

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg font-semibold">
          {firstName} {lastName}'s Vote Timeline
        </CardTitle>
        <VoteSearchBar onSearch={handleSearch} isLoading={isLoading} />
      </CardHeader>
      <CardContent className="p-0">
        <VoteResultsList
          votes={votes}
          total={total}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          searchTerms={searchTerms}
          name={`${firstName} ${lastName}`}
        />
      </CardContent>
    </Card>
  );
}
