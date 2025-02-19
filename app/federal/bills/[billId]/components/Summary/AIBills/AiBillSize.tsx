import { Legislation } from "@prisma/client";
import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toCapitalCase } from "@/lib/utils/StringFunctions";

interface AiBillSizeProps {
  bill: Legislation;
}

const AiBillSize = ({ bill }: AiBillSizeProps) => {
  const getSegmentFill = (segment: number) => {
    const sizeMap = {
      SMALL: 1,
      MEDIUM: 2,
      LARGE: 3,
    };

    const currentSize = sizeMap[bill.bill_size as keyof typeof sizeMap] || 0;
    return segment <= currentSize;
  };

  const sizeDescriptions = {
    SMALL: {
      range: "0-4,000 words",
      description: "Easier to summarize with high accuracy",
    },
    MEDIUM: {
      range: "4,001-14,000 words",
      description: "Moderate complexity in summarization",
    },
    LARGE: {
      range: "14,000+ words",
      description: "Complex summarization requiring more discretion",
    },
  };

  return (
    <div className="bg-transparent">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex flex-col items-center rounded-full  shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            {/* Size Label */}

            {/* Thermometer */}
            <div className="flex flex-col gap-1 w-8">
              <div
                className={`h-6 rounded-t-full ${
                  getSegmentFill(3)
                    ? "bg-red-500"
                    : "bg-muted-foreground/50 dark:bg-muted"
                }`}
              />
              <div
                className={`h-6 rounded-sm ${
                  getSegmentFill(2)
                    ? "bg-orange-400"
                    : "bg-muted-foreground/50 dark:bg-muted"
                }`}
              />
              <div
                className={`h-6 rounded-b-full ${
                  getSegmentFill(1)
                    ? "bg-green-500"
                    : "bg-muted-foreground/50 dark:bg-muted"
                }`}
              />
            </div>
          </div>
        </HoverCardTrigger>

        <HoverCardContent side="right" align="end" className="w-80">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Bill Size Categories</h4>
            <div className="flex items-center gap-2">
              <p> {toCapitalCase(bill.bill_size)}</p>
              <span className="text-sm italics text-muted-foreground">
                ({bill.word_count} words in this bill)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">
                    Large ({sizeDescriptions.LARGE.range})
                  </p>
                  <p className="text-xs text-gray-500">
                    {sizeDescriptions.LARGE.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full" />
                <div>
                  <p className="text-sm font-medium">
                    Medium ({sizeDescriptions.MEDIUM.range})
                  </p>
                  <p className="text-xs text-gray-500">
                    {sizeDescriptions.MEDIUM.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">
                    Small ({sizeDescriptions.SMALL.range})
                  </p>
                  <p className="text-xs text-gray-500">
                    {sizeDescriptions.SMALL.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default AiBillSize;
