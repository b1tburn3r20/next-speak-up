"use client";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoteSummaryCard } from "./BillVotes/vote-summary-card";
import { FilterPopover } from "./BillVotes/filter-popover";
import { MemberVoteCard } from "./BillVotes/member-vote-card";
import { SearchBar } from "./BillVotes/search-bar";

const BillVotes = ({ votes }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [filters, setFilters] = useState({
    showYea: true,
    showNay: true,
    showNotVoting: true,
    showPresent: true,
    showOnlyFavorites: false,
  });

  const latestVote = votes[0];
  if (!latestVote) return null;

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearchQuery]);

  const totalVotes =
    latestVote.totalYea +
    latestVote.totalNay +
    latestVote.totalNotVoting +
    latestVote.totalPresent;

  const filteredMembers = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    const filtered = latestVote.memberVotes.filter((member) => {
      const matchesSearch =
        member.firstName?.toLowerCase().includes(query) ||
        member.lastName?.toLowerCase().includes(query) ||
        member.state?.toLowerCase().includes(query) ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(query);

      const matchesPosition =
        (member.votePosition === "YEA" && filters.showYea) ||
        (member.votePosition === "NAY" && filters.showNay) ||
        (member.votePosition === "NOT_VOTING" && filters.showNotVoting) ||
        (member.votePosition === "PRESENT" && filters.showPresent);

      const matchesFavorites = filters.showOnlyFavorites
        ? member.isFavorited
        : true;

      return matchesSearch && matchesPosition && matchesFavorites;
    });

    const favorites = filtered.filter((m) => m.isFavorited);
    const others = filtered.filter((m) => !m.isFavorited);

    return [...favorites, ...others];
  }, [latestVote.memberVotes, debouncedSearchQuery, filters]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Vote Results</span>
          <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Voted on {format(new Date(latestVote.date), "MMMM d, yyyy")}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Vote Summary */}
          <div className="flex gap-3 items-center justify-center">
            {latestVote.totalYea > 0 && (
              <VoteSummaryCard
                voteCount={latestVote.totalYea}
                totalVotes={totalVotes}
                type="YEA"
              />
            )}
            {latestVote.totalNay > 0 && (
              <VoteSummaryCard
                voteCount={latestVote.totalNay}
                totalVotes={totalVotes}
                type="NAY"
              />
            )}
            {latestVote.totalNotVoting > 0 && (
              <VoteSummaryCard
                voteCount={latestVote.totalNotVoting}
                totalVotes={totalVotes}
                type="NOT_VOTING"
              />
            )}
            {latestVote.totalPresent > 0 && (
              <VoteSummaryCard
                voteCount={latestVote.totalPresent}
                totalVotes={totalVotes}
                type="PRESENT"
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearching={isSearching}
            />
            <FilterPopover filters={filters} setFilters={setFilters} />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <MemberVoteCard key={member.bioguideId} member={member} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillVotes;
