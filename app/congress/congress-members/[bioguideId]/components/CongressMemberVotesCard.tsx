import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

type RecentVote = {
  date: Date;
  billName: string | null;
  billTitle: string | null;
  votePosition: string;
  billNameId: string | null;
};

interface CongressMemberVotesCardProps {
  recentVotes: RecentVote[];
}

export function CongressMemberVotesCard({
  recentVotes,
}: CongressMemberVotesCardProps) {
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

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-lg font-semibold">
          Most Recent 10 Votes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {recentVotes.map((vote, index) => {
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
                    {vote.billTitle}
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
                    {vote.billTitle}{" "}
                    <span className="ml-5 italic text-xs text-muted-foreground ">
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
        </div>
      </CardContent>
    </Card>
  );
}
