import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

interface PolicyAreaLegislation {
  name_id: string;
  title: string;
  number: string;
}

interface VotePolicyHoverCardProps {
  children: React.ReactNode;
  policyArea: string;
  legislation: PolicyAreaLegislation[];
}

export function VotePolicyHoverCard({
  children,
  policyArea,
  legislation,
}: VotePolicyHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">{policyArea}</h4>
          <ScrollArea className="h-[150px]">
            <div className="flex flex-col gap-2">
              {legislation.map((bill) => (
                <Link
                  key={bill.name_id}
                  href={`/federal/bills/${bill.name_id}`}
                  className="text-sm hover:underline"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{bill.number}</span>
                    <span className="text-muted-foreground line-clamp-2">
                      {bill.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
