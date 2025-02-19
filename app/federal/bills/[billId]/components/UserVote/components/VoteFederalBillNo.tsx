"use client";

import { Legislation } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VoteFederalBillNoProps {
  bill: Legislation;
  isSelected: boolean;
  onSelect: () => void;
}

export function VoteFederalBillNo({
  bill,
  isSelected,
  onSelect,
}: VoteFederalBillNoProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-lg border p-6 cursor-pointer transition-all",
        "hover:border-red-500 hover:shadow-md",
        isSelected && "border-red-500 bg-red-50",
        "relative"
      )}
    >
      {isSelected && (
        <div className="absolute top-4 right-4">
          <Check className="w-5 h-5 text-red-600" />
        </div>
      )}

      <h3 className="font-semibold text-red-600 text-lg mb-3">Oppose</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Concerns</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Potential economic impact</li>
            <li>• Implementation challenges</li>
            <li>• Resource allocation issues</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Key Opposition</h4>
          <p className="text-sm text-muted-foreground">
            Industry stakeholders, policy analysts, and affected communities
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Click to cast your vote in opposition to this legislation</p>
        </div>
      </div>
    </div>
  );
}
