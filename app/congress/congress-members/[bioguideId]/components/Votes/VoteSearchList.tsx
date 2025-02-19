import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface VoteResult {
  date: Date;
  billName: string | null;
  billTitle: string | null;
  votePosition: string;
  billNameId: string | null;
}

interface VoteResultsListProps {
  votes: VoteResult[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  searchTerms: { term: string; color: string }[];
  name: string;
}

export function VoteResultsList({
  votes,
  total,
  hasMore,
  isLoading,
  onLoadMore,
  searchTerms,
  name,
}: VoteResultsListProps) {
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

  const highlightText = (text: string | null) => {
    if (!text) return "";
    let safeText = String(text);

    searchTerms.forEach(({ term, color }) => {
      const regex = new RegExp(`(${term})`, "gi");
      safeText = safeText.replace(
        regex,
        `<mark class="${color} rounded-sm px-0.5">$1</mark>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: safeText }} />;
  };

  const renderSkeletons = () => {
    const remainingSlots = 10 - votes.length;
    return remainingSlots > 0
      ? Array(remainingSlots)
          .fill(0)
          .map((_, index) => (
            <div key={`skeleton-${index}`} className="p-4">
              <Skeleton className="w-full h-14" />
            </div>
          ))
      : null;
  };

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Found {total} results
          </span>
        </div>
      )}
      <div className="divide-y divide-border/50">
        {votes.map((vote, index) => {
          const voteStyle = getVoteDisplay(vote.votePosition);
          const VoteIcon = voteStyle.icon;

          return vote.billNameId ? (
            <Link
              href={`/federal/bills/${vote.billNameId}`}
              key={index}
              className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200 hover:pl-6"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {highlightText(vote.billTitle)}
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${voteStyle.classes} transition-all duration-200`}
              >
                <VoteIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{voteStyle.text}</span>
              </div>
            </Link>
          ) : (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-red-500/10"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium truncate">
                  {highlightText(vote.billTitle)}{" "}
                  <span className="ml-5 italic text-xs text-muted-foreground">
                    - Missing Data
                  </span>
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${voteStyle.classes}`}
              >
                <VoteIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{voteStyle.text}</span>
              </div>
            </div>
          );
        })}
        {renderSkeletons()}
      </div>
      <div className="flex items-center flex-end justify-end p-4 gap-4 border-t">
        <Link
          href="/federal/votes"
          className="text-sm text-muted-foreground/50 italic hover:text-primary"
        >
          View all {name}'s votes
        </Link>
        {hasMore && (
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="ghost"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Load more results"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
