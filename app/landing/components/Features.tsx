import { FileText, Search, TrendingUp, MessageSquare } from "lucide-react";
import { BoxReveal } from "@/components/magicui/box-reveal";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: FileText,
    name: "AI Bill Summaries & Chatbot",
    description:
      "Complex legislation made simple with AI-powered summaries and instant answers to any political questions.",
    href: "/bills",
    cta: "Try it out",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="space-y-3 p-4 w-full">
          <div className="h-2 md:h-3 bg-primary/40 rounded w-3/4"></div>
          <div className="h-2 md:h-3 bg-muted-foreground/30 rounded w-full"></div>
          <div className="h-2 md:h-3 bg-primary/60 rounded w-1/2"></div>
          <div className="mt-4 space-y-1">
            <div className="bg-primary rounded p-1 ml-6">
              <div className="h-1 bg-primary-foreground/50 rounded"></div>
            </div>
            <div className="bg-muted rounded p-1 mr-6">
              <div className="h-1 bg-muted-foreground rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    Icon: Search,
    name: "Bill & Congress Tracking",
    description:
      "Follow legislation lifecycle and monitor your representatives' voting patterns and committee assignments.",
    href: "/legislators",
    cta: "Start tracking",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="space-y-4 w-full p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="h-2 bg-muted-foreground rounded flex-1"></div>
            <div className="text-xs opacity-50 hidden md:block">Introduced</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary/70 rounded-full"></div>
            <div className="h-2 bg-muted-foreground rounded flex-1"></div>
            <div className="text-xs opacity-50 hidden md:block">Committee</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary/40 rounded-full"></div>
            <div className="h-2 bg-muted rounded flex-1"></div>
            <div className="text-xs opacity-50 hidden md:block">House Vote</div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 md:w-6 md:h-6 bg-primary/60 rounded-full"
              ></div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    Icon: MessageSquare,
    name: "Community & Features",
    description:
      "Engage in political discussions, use text-to-speech for accessibility, and enjoy our constantly evolving modern platform.",
    href: "/forum",
    cta: "Join community",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="flex space-x-4 md:space-x-8 w-full p-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 md:w-6 md:h-6 bg-primary/60 rounded-full"></div>
              <div className="h-2 bg-muted-foreground/40 rounded flex-1"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 md:w-6 md:h-6 bg-primary/40 rounded-full"></div>
              <div className="h-2 bg-muted-foreground/40 rounded flex-1"></div>
            </div>
          </div>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 md:w-2 bg-primary rounded animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.2}s`,
                }}
              ></div>
            ))}
          </div>
          <div className="relative hidden md:block">
            <div className="w-8 h-8 md:w-12 md:h-12 border border-primary/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 w-4 h-4 md:w-8 md:h-8 bg-primary/20 rounded-full"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    Icon: TrendingUp,
    name: "Alignment Tracking",
    description:
      "Vote on bills and see how well your views align with your representatives over time.",
    href: "/dashboard",
    cta: "Check alignment",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-full p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground hidden md:block">
                Rep. Johnson
              </span>
              <div className="flex space-x-1">
                <div className="w-12 md:w-16 h-2 bg-primary rounded"></div>
                <div className="w-3 md:w-4 h-2 bg-muted rounded"></div>
              </div>
              <span className="text-xs text-muted-foreground">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground hidden md:block">
                Sen. Smith
              </span>
              <div className="flex space-x-1">
                <div className="w-8 md:w-12 h-2 bg-primary rounded"></div>
                <div className="w-6 md:w-8 h-2 bg-muted rounded"></div>
              </div>
              <span className="text-xs text-muted-foreground">62%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground hidden md:block">
                Sen. Davis
              </span>
              <div className="flex space-x-1">
                <div className="w-6 md:w-10 h-2 bg-primary rounded"></div>
                <div className="w-9 md:w-10 h-2 bg-muted rounded"></div>
              </div>
              <span className="text-xs text-muted-foreground">45%</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const Features = () => {
  return (
    <div className="space-y-8">
      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
};

export default Features;
