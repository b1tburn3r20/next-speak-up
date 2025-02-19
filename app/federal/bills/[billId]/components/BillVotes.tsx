"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Search,
  Heart,
  CalendarIcon,
  Settings2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import NumberTicker from "@/components/ui/number-ticker";

type BillVote = {
  date: string;
  totalYea: number;
  totalNay: number;
  totalNotVoting: number;
  totalPresent: number;
  memberVotes: Array<{
    bioguideId: string;
    firstName: string | null;
    lastName: string | null;
    state: string | null;
    votePosition: string;
    isFavorited: boolean;
    depiction?: {
      imageUrl?: string;
    };
  }>;
};

type BillVotesProps = {
  votes: BillVote[];
};

const BillVotes = ({ votes }: BillVotesProps) => {
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

  const getVoteDisplay = (position: string) => {
    switch (position) {
      case "YEA":
        return {
          text: "Voted Yes",
          icon: CheckCircle2,
          classes:
            "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20",
        };
      case "NAY":
        return {
          text: "Voted No",
          icon: XCircle,
          classes:
            "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20",
        };
      case "PRESENT":
        return {
          text: "Present",
          icon: MinusCircle,
          classes:
            "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20",
        };
      default:
        return {
          text: "Did Not Vote",
          icon: MinusCircle,
          classes:
            "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
        };
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    const percentage = (value / total) * 100;
    return percentage.toFixed(1);
  };

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

    // First separate favorites and non-favorites
    const favorites = filtered.filter((m) => m.isFavorited);
    const others = filtered.filter((m) => !m.isFavorited);

    // Return favorites followed by others
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
              <div className="rounded-lg p-3 flex flex-col items-center  bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    {calculatePercentage(latestVote.totalYea, totalVotes)}
                  </span>
                  <Percent className="w-4 h-4 ml-0.5 " />
                </div>
                <span className="text-sm font-extrabold ">Voted Yes</span>
              </div>
            )}

            {latestVote.totalNay > 0 && (
              <div className=" rounded-lg p-3 flex flex-col items-center bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold ">
                    {calculatePercentage(latestVote.totalNay, totalVotes)}
                  </span>
                  <Percent className="w-4 h-4 ml-0.5 " />
                </div>
                <span className="text-sm font-extrabold  ">Voted No</span>
              </div>
            )}

            {latestVote.totalNotVoting > 0 && (
              <div className="bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20 rounded-lg p-3 flex flex-col items-center">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold ">
                    {calculatePercentage(latestVote.totalNotVoting, totalVotes)}
                  </span>
                  <Percent className="w-4 h-4 ml-0.5 " />
                </div>
                <span className="text-sm font-extrabold ">Not voting</span>
              </div>
            )}

            {latestVote.totalPresent > 0 && (
              <div className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 rounded-lg p-3 flex flex-col items-center">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold ">
                    {calculatePercentage(latestVote.totalPresent, totalVotes)}
                  </span>
                  <Percent className="w-4 h-4 ml-0.5 " />
                </div>
                <span className="text-sm">Present</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Popover>
              <PopoverTrigger>
                <div className="p-2 hover:bg-muted rounded-md">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none mb-3">
                    Filter Options
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show only favorites</label>
                      <Switch
                        checked={filters.showOnlyFavorites}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            showOnlyFavorites: checked,
                          }))
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Yea votes</label>
                      <Switch
                        checked={filters.showYea}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, showYea: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Nay votes</label>
                      <Switch
                        checked={filters.showNay}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, showNay: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Present</label>
                      <Switch
                        checked={filters.showPresent}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            showPresent: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Not Voting</label>
                      <Switch
                        checked={filters.showNotVoting}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            showNotVoting: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Member Votes List */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const voteStyle = getVoteDisplay(member.votePosition);
                const VoteIcon = voteStyle.icon;

                return (
                  <Link
                    href={`/congress/congress-members/${member.bioguideId}`}
                    key={member.bioguideId}
                    className={cn(
                      "group flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200 hover:pl-6 rounded-lg",
                      member.isFavorited && "border-b mb-2"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        {member.depiction?.imageUrl ? (
                          <AvatarImage
                            src={member.depiction.imageUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium group-hover:text-blue-600 transition-colors">
                            {member.firstName} {member.lastName}
                          </span>
                          {member.isFavorited && (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.state}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${voteStyle.classes}`}
                    >
                      <VoteIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {voteStyle.text}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillVotes;
