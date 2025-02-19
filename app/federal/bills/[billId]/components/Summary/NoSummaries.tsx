import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type NoSummariesProps = {
  className?: string;
};

const NoSummaries = ({ className = "" }: NoSummariesProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">No Summary Available</p>
            <p className="text-sm text-muted-foreground">
              This legislation is either too old or not currently active to have
              an available summary.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoSummaries;
