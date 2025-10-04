import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBillPageStore } from "../useBillPageStore";
import { useEffect } from "react";

interface OfficialSummaryVersionSelectorProps {
  className?: string;
}

const OfficialSummaryVersionSelector = ({
  className = "",
}: OfficialSummaryVersionSelectorProps) => {
  const bill = useBillPageStore((s) => s.billData?.legislation);
  const currentOfficialSummary = useBillPageStore(
    (s) => s.currentOfficialSummary
  );
  const setCurrentOfficialSummary = useBillPageStore(
    (s) => s.setCurrentOfficialSummary
  );

  const officialSummaries = bill?.summaries || [];

  // Initialize with most recent official summary
  useEffect(() => {
    if (officialSummaries.length > 0 && !currentOfficialSummary) {
      const mostRecent = officialSummaries.sort(
        (a, b) =>
          new Date(b.actionDate || b.createdAt).getTime() -
          new Date(a.actionDate || a.createdAt).getTime()
      )[0];
      const dateString = new Date(mostRecent.actionDate || mostRecent.createdAt)
        .toISOString()
        .split("T")[0];
      setCurrentOfficialSummary(dateString);
    }
  }, [officialSummaries, currentOfficialSummary, setCurrentOfficialSummary]);

  // Don't render if no official summaries or only one
  if (officialSummaries.length <= 1) {
    return null;
  }

  const handleSummaryChange = (summaryId: string) => {
    const summary = officialSummaries.find(
      (s) => s.id?.toString() === summaryId
    );
    if (summary) {
      const dateString = new Date(summary.actionDate || summary.createdAt)
        .toISOString()
        .split("T")[0];
      setCurrentOfficialSummary(dateString);
    }
  };

  // Find currently selected summary
  const selectedSummary = officialSummaries.find((s) => {
    const summaryDate = new Date(s.actionDate || s.createdAt)
      .toISOString()
      .split("T")[0];
    return summaryDate === currentOfficialSummary;
  });

  return (
    <div className={`mb-4 px-4 sm:px-6 ${className}`}>
      <Select
        value={selectedSummary?.id?.toString() || ""}
        onValueChange={handleSummaryChange}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Select official summary version" />
        </SelectTrigger>
        <SelectContent>
          {officialSummaries.map((summary, index) => (
            <SelectItem
              key={summary.id || index}
              value={summary.id?.toString() || index.toString()}
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                {summary.actionDesc
                  ? `${summary.actionDesc} (${new Date(
                      summary.actionDate || summary.createdAt
                    ).toLocaleDateString()})`
                  : `Summary ${index + 1} (${new Date(
                      summary.actionDate || summary.createdAt
                    ).toLocaleDateString()})`}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default OfficialSummaryVersionSelector;
