import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Compare = () => {
  interface Competitor {
    tag: string;
    name: string;
    link: string;
    borderColor: string;
    textColor: string;
  }

  interface CompetitorCardProps {
    competitor: Competitor;
  }

  // Government tracking competitors with proper light/dark mode colors
  const competitors: Competitor[] = [
    {
      tag: "Government Tracking",
      name: "GovTrack.us",
      link: "https://govtrack.us",
      borderColor: "border-l-rose-500 dark:border-l-rose-400",
      textColor: "text-rose-600 dark:text-rose-400",
    },
    {
      tag: "Legislative Enterprise Analytics",
      name: "Quorum",
      link: "https://quorum.us",
      borderColor: "border-l-indigo-600 dark:border-l-indigo-400",
      textColor: "text-indigo-700 dark:text-indigo-400",
    },
    {
      tag: "Official Government",
      name: "Congress.gov",
      link: "https://congress.gov",
      borderColor: "border-l-blue-600 dark:border-l-blue-400",
      textColor: "text-blue-700 dark:text-blue-400",
    },
  ];

  const CompetitorCard = ({ competitor }: CompetitorCardProps) => {
    return (
      <Link
        href={competitor.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block relative"
      >
        <div
          className={`p-4 md:p-6 border-l-8 ${competitor.borderColor} bg-accent/30 dark:bg-accent hover:bg-accent/40 transition-all duration-300 rounded-lg shadow-sm cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-muted-foreground/80 uppercase tracking-wide font-semibold">
                {competitor.tag}
              </p>
              <p
                className={`text-lg md:text-xl font-bold ${competitor.textColor}`}
              >
                {competitor.name}
              </p>
            </div>
            <ArrowRight
              className={`w-5 h-5 ${competitor.textColor} group-hover:translate-x-1 transition-all duration-300`}
            />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 place-items-center place-content-center px-4 py-8 lg:py-16">
      <div className="space-y-4 lg:space-y-6 max-w-lg">
        <h3 className="font-bold text-2xl md:text-3xl lg:text-4xl leading-tight">
          Compare Coolbills to other platforms on the market
        </h3>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Here we focus on you, showing the public what they want to see. This
          means removing all of the fluff and seeing whats happening at the top,
          and using technology to do more and make a difference.
        </p>
        <Link
          href="#"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200 group"
        >
          Learn what makes Coolbills different
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
      <div className="w-full max-w-md lg:max-w-lg">
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {competitors.map((competitor, index) => (
            <CompetitorCard key={index} competitor={competitor} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Compare;
