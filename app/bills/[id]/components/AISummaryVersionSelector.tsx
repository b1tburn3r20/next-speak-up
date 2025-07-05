"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBillPageStore } from "../useBillPageStore";
import { useEffect } from "react";
import ReadBillToMe from "./ReadBillToMe";

interface AiSummaryVersionSelectorProps {
  className?: string;
}

const AiSummaryVersionSelector = ({
  className = "",
}: AiSummaryVersionSelectorProps) => {
  const bill = useBillPageStore((s) => s.billData?.legislation);
  const currentAiSummary = useBillPageStore((s) => s.currentAiSummary);
  const setCurrentAiSummary = useBillPageStore((s) => s.setCurrentAiSummary);
  const currentAiSummaryText = useBillPageStore((f) => f.currentAiSummaryText);
  const aiSummaries = bill?.aiSummaries || [];
  const billSize = bill?.bill_size;

  // Initialize with most recent AI summary
  useEffect(() => {
    if (aiSummaries.length > 0 && !currentAiSummary) {
      const mostRecent = aiSummaries.sort(
        (a, b) =>
          new Date(b.actionDate || b.createdAt).getTime() -
          new Date(a.actionDate || a.createdAt).getTime()
      )[0];
      const dateString = new Date(mostRecent.actionDate || mostRecent.createdAt)
        .toISOString()
        .split("T")[0];
      setCurrentAiSummary(dateString);
    }
  }, [aiSummaries, currentAiSummary, setCurrentAiSummary]);

  // Don't render if no AI summaries
  if (aiSummaries.length === 0) {
    return null;
  }

  const handleSummaryChange = (summaryId: string) => {
    const summary = aiSummaries.find((s) => s.id?.toString() === summaryId);
    if (summary) {
      const dateString = new Date(summary.actionDate || summary.createdAt)
        .toISOString()
        .split("T")[0];
      setCurrentAiSummary(dateString);
    }
  };

  // Find currently selected summary
  const selectedSummary = aiSummaries.find((s) => {
    const summaryDate = new Date(s.actionDate || s.createdAt)
      .toISOString()
      .split("T")[0];
    return summaryDate === currentAiSummary;
  });

  // If only one summary, show it as static text
  if (aiSummaries.length === 1) {
    const summary = aiSummaries[0];
    const date = new Date(
      summary.actionDate || summary.createdAt
    ).toLocaleDateString();
    const type = summary.type || "Version 1";

    return (
      <div className={`my-4 px-3 sm:px-6 ${className}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">AI Summary Version:</span>
          </div>

          {/* Version info and TTS controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm font-medium">
                {type} - {date}
              </span>
            </div>

            {/* TTS Controls */}
            <div className="flex items-center gap-2">
              {billSize === "Very Long" ? (
                <p className="text-xs text-muted-foreground italic">
                  Bill too long for TTS
                </p>
              ) : (
                currentAiSummaryText && <ReadBillToMe />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format the display text for the trigger
  const getDisplayText = (summary: any) => {
    const date = new Date(
      summary.actionDate || summary.createdAt
    ).toLocaleDateString();
    const type = summary.type
      ? `${summary.type}`
      : `Version ${aiSummaries.indexOf(summary) + 1}`;
    return `${type} - ${date}`;
  };

  return (
    <div className={`my-4 px-3 sm:px-6 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">AI Summary Version:</span>
        </div>

        {/* Version selector and controls */}
        <div className="space-y-3">
          {/* Main container with responsive layout */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left side: Selector + version count */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 lg:flex-1">
              <Select
                value={selectedSummary?.id?.toString() || ""}
                onValueChange={handleSummaryChange}
              >
                <SelectTrigger className="w-full sm:w-auto sm:min-w-[280px] sm:max-w-[400px]">
                  <SelectValue
                    placeholder="Select AI summary version"
                    className="truncate"
                  >
                    {selectedSummary && (
                      <div className="flex items-center gap-2 truncate">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="truncate">
                          {getDisplayText(selectedSummary)}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="max-w-[95vw] sm:max-w-[400px]">
                  {aiSummaries
                    .sort(
                      (a, b) =>
                        new Date(b.actionDate || b.createdAt).getTime() -
                        new Date(a.actionDate || a.createdAt).getTime()
                    )
                    .map((summary, index) => {
                      const isSelected = selectedSummary?.id === summary.id;
                      const date = new Date(
                        summary.actionDate || summary.createdAt
                      );
                      const formattedDate = date.toLocaleDateString();
                      const type = summary.type || `Version ${index + 1}`;

                      return (
                        <SelectItem
                          key={summary.id || index}
                          value={summary.id?.toString() || index.toString()}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                  isSelected
                                    ? "bg-primary"
                                    : "bg-muted-foreground"
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">
                                    AI Summary {type}
                                  </span>
                                  {index === 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs flex-shrink-0"
                                    >
                                      Latest
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  <span>{formattedDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>

              <span className="text-xs text-muted-foreground italic sm:whitespace-nowrap">
                {aiSummaries.length} versions available
              </span>
            </div>

            {/* Right side: TTS controls */}
            <div className="flex items-center gap-2 lg:flex-shrink-0">
              {billSize === "Very Long" ? (
                <p className="text-xs text-muted-foreground italic">
                  Bill too long for TTS
                </p>
              ) : (
                currentAiSummaryText && <ReadBillToMe />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSummaryVersionSelector;
