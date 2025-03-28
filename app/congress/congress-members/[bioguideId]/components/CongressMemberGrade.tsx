import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { CongressMemberGrade as GradeType } from "@/lib/services/congress_two";

interface CongressMemberGradeCardProps {
  grade: GradeType;
}

export default function CongressMemberGradeCard({
  grade,
}: CongressMemberGradeCardProps) {
  const getGradeColor = (grade: string) => {
    switch (grade[0]) {
      case "A":
        return "text-green-600 dark:text-green-400";
      case "B":
        return "text-blue-600 dark:text-blue-400";
      case "C":
        return "text-yellow-600 dark:text-yellow-400";
      case "D":
        return "text-orange-600 dark:text-orange-400";
      case "F":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getGradeBackground = (grade: string) => {
    switch (grade[0]) {
      case "A":
        return "bg-green-50 dark:bg-green-900/20";
      case "B":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "C":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "D":
        return "bg-orange-50 dark:bg-orange-900/20";
      case "F":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <Card className="p-6 h-fit shadow-none border-none">
      <HoverCard openDelay={200}>
        <HoverCardTrigger>
          <div className="flex items-center justify-between cursor-default group">
            <div
              className={`w-16 h-16 rounded-full ${getGradeBackground(
                grade.overall
              )} flex items-center justify-center transition-transform group-hover:scale-110`}
            >
              <span
                className={`text-2xl font-bold ${getGradeColor(grade.overall)}`}
              >
                {grade.overall}
              </span>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-96 p-6  shadow-xl">
          <div className="space-y-6">
            <div className="pb-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Overall Performance
                </span>
                <span className={`font-bold ${getGradeColor(grade.overall)}`}>
                  {grade.overall} ({grade.overallScore.toFixed(1)}%)
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comprehensive evaluation across all metrics
              </p>
            </div>
            <div className="space-y-4">
              {grade.metrics.map((metric, index) => (
                <div
                  key={metric.name}
                  className="p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {metric.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${getGradeColor(metric.grade)}`}
                      >
                        {metric.grade}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({metric.score.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </Card>
  );
}
