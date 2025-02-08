"use client";
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

interface PolicyAreaListProps {
  policyAreas: {
    policy_area: {
      name: string | null;
    } | null;
    count: number;
  }[];
  total: number;
  title?: string;
}

export function PolicyAreaListView({
  policyAreas,
  total,
  title = "Policy Areas",
}: PolicyAreaListProps) {
  const sortedAreas = policyAreas.slice().sort((a, b) => b.count - a.count);

  return (
    <Card className="w-full border-t rounded-none shadow-none">
      <CardHeader className="pb-0">
        <div className="flex flex-col space-y-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Total Bills: {total}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[357px] pr-4 ">
          {sortedAreas.map((area, index) => (
            <div
              key={area.policy_area?.name || index}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-6">{index + 1}.</span>
                <span className="font-medium">
                  {area.policy_area?.name || "Unnamed Policy"}
                </span>
                <PolicyAreaInfo policyArea={area.policy_area?.name || ""} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {area.count} ({((area.count / total) * 100).toFixed(1)}%)
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
