"use client";

import { Legislation } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VoteFederalBillYesProps {
  bill: Legislation;
  isSelected: boolean;
  onSelect: () => void;
}

export function VoteFederalBillYes({
  bill,
  isSelected,
  onSelect,
}: VoteFederalBillYesProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-lg border p-6 cursor-pointer transition-all",
        "hover:border-green-500 hover:shadow-md",
        isSelected && "border-green-500 bg-green-50",
        "relative"
      )}
    >
      {isSelected && (
        <div className="absolute top-4 right-4">
          <Check className="w-5 h-5 text-green-600" />
        </div>
      )}

      <h3 className="font-semibold text-green-600 text-lg mb-3">Support</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Why Support?</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Promotes economic growth and innovation</li>
            <li>• Strengthens regulatory framework</li>
            <li>• Benefits local communities</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Key Supporters</h4>
          <p className="text-sm text-muted-foreground">
            Major industry associations, community organizations, and policy
            experts
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Click to cast your vote in support of this legislation</p>
        </div>
      </div>
    </div>
  );
}
