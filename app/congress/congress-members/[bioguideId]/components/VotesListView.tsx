import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PolicyAreaInfo } from "./PolicyAreaLegendPopover";
import type { PolicyAreaVoteCount } from "@/lib/services/congress_two";

interface VoteListViewProps {
  policyAreaVotes: PolicyAreaVoteCount[];
  title: string;
  description: string;
  voteType: "all" | "yea" | "nay" | "notVoting";
}

export default function VoteListView({
  policyAreaVotes,
  title,
  description,
  voteType,
}: VoteListViewProps) {
  const sortedAreas = policyAreaVotes.slice().sort((a, b) => b.count - a.count);
  const total = sortedAreas.reduce((sum, area) => sum + area.count, 0);

  const getVoteTypeColor = (type: typeof voteType) => {
    switch (type) {
      case "yea":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "nay":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "notVoting":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  return (
    <Card className="w-full border-t rounded-none shadow-none">
      <CardHeader className="pb-0">
        <div className="flex flex-col space-y-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[357px] pr-4">
          {sortedAreas.map((area) => (
            <div
              key={area.policyArea}
              className="space-y-4 py-4 border-b last:border-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">{area.policyArea}</span>
                  <PolicyAreaInfo policyArea={area.policyArea} />
                </div>
                <Badge
                  variant="secondary"
                  className={getVoteTypeColor(voteType)}
                >
                  {area.count} votes ({area.percentage.toFixed(1)}%)
                </Badge>
              </div>

              <div className="space-y-2 pl-4">
                {area.legislation.map((bill) => (
                  <div
                    key={bill.name_id}
                    className="text-sm text-muted-foreground"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-24">
                        {bill.number || "No Number"}
                      </span>
                      <span>{bill.title}</span>
                    </div>
                    <div className="text-xs mt-1">
                      {new Date(bill.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
