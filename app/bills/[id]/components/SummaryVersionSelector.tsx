import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SummaryOption {
  id: string;
  label: string;
  text: string;
  date: Date;
  type: "regular" | "ai";
  actionDesc?: string;
  aiType?: string;
  originalId: number;
}

interface SummaryVersionSelectorProps {
  summaries: any[];
  aiSummaries: any[];
  selectedSummaryId: string;
  onSummaryChange: (summaryId: string) => void;
  className?: string;
}

const SummaryVersionSelector = ({
  summaries,
  aiSummaries,
  selectedSummaryId,
  onSummaryChange,
  className = "",
}: SummaryVersionSelectorProps) => {
  // Helper function to create summary options from both regular and AI summaries
  const createSummaryOptions = (): SummaryOption[] => {
    const options: SummaryOption[] = [];

    // Add regular summaries
    if (summaries && summaries.length > 0) {
      summaries.forEach((summary, index) => {
        if (summary.text) {
          options.push({
            id: `regular-${summary.id || index}`,
            label: summary.actionDesc
              ? `${summary.actionDesc} (${new Date(
                  summary.actionDate || summary.createdAt
                ).toLocaleDateString()})`
              : `Summary ${index + 1} (${new Date(
                  summary.actionDate || summary.createdAt
                ).toLocaleDateString()})`,
            text: summary.text,
            date: new Date(summary.actionDate || summary.createdAt),
            type: "regular",
            actionDesc: summary.actionDesc,
            originalId: summary.id || index,
          });
        }
      });
    }

    // Add AI summaries
    if (aiSummaries && aiSummaries.length > 0) {
      aiSummaries.forEach((aiSummary, index) => {
        if (aiSummary.text) {
          options.push({
            id: `ai-${aiSummary.id || index}`,
            label: `AI Summary${
              aiSummary.type ? ` (${aiSummary.type})` : ` ${index + 1}`
            } (${new Date(
              aiSummary.actionDate || aiSummary.createdAt
            ).toLocaleDateString()})`,
            text: aiSummary.text,
            date: new Date(aiSummary.actionDate || aiSummary.createdAt),
            type: "ai",
            aiType: aiSummary.type,
            originalId: aiSummary.id || index,
          });
        }
      });
    }

    // Sort by date, most recent first
    options.sort((a, b) => b.date.getTime() - a.date.getTime());

    return options;
  };

  const summaryOptions = createSummaryOptions();

  // Don't render if there's only one or no summaries
  if (summaryOptions.length <= 1) {
    return null;
  }

  return (
    <div className={`mb-4 px-4 sm:px-6 ${className}`}>
      <Select value={selectedSummaryId} onValueChange={onSummaryChange}>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Select summary version" />
        </SelectTrigger>
        <SelectContent>
          {summaryOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    option.type === "ai" ? "bg-blue-500" : "bg-green-500"
                  }`}
                />
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Helper function to get summary options (exported for use in store)
export const createSummaryOptions = (summaries: any[], aiSummaries: any[]) => {
  const options: SummaryOption[] = [];

  // Add regular summaries
  if (summaries && summaries.length > 0) {
    summaries.forEach((summary, index) => {
      if (summary.text) {
        options.push({
          id: `regular-${summary.id || index}`,
          label: summary.actionDesc
            ? `${summary.actionDesc} (${new Date(
                summary.actionDate || summary.createdAt
              ).toLocaleDateString()})`
            : `Summary ${index + 1} (${new Date(
                summary.actionDate || summary.createdAt
              ).toLocaleDateString()})`,
          text: summary.text,
          date: new Date(summary.actionDate || summary.createdAt),
          type: "regular",
          actionDesc: summary.actionDesc,
          originalId: summary.id || index,
        });
      }
    });
  }

  // Add AI summaries
  if (aiSummaries && aiSummaries.length > 0) {
    aiSummaries.forEach((aiSummary, index) => {
      if (aiSummary.text) {
        options.push({
          id: `ai-${aiSummary.id || index}`,
          label: `AI Summary${
            aiSummary.type ? ` (${aiSummary.type})` : ` ${index + 1}`
          } (${new Date(
            aiSummary.actionDate || aiSummary.createdAt
          ).toLocaleDateString()})`,
          text: aiSummary.text,
          date: new Date(aiSummary.actionDate || aiSummary.createdAt),
          type: "ai",
          aiType: aiSummary.type,
          originalId: aiSummary.id || index,
        });
      }
    });
  }

  // Sort by date, most recent first
  options.sort((a, b) => b.date.getTime() - a.date.getTime());

  return options;
};

export default SummaryVersionSelector;
export type { SummaryOption };
