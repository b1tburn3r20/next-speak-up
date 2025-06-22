import { Card } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

interface EmptyBillCardProps {
  title?: string;
  message?: string;
  actionText?: string;
  onClick?: () => void;
}

const EmptyBillCard = ({
  title = "Empty",
  message = "Looks like you're new here. Click a bill to get started!",
  actionText = "Browse Bills",
  onClick,
}: EmptyBillCardProps) => {
  return (
    <Card className="max-h-[300px] aspect-square select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-dashed border-border/30 rounded-3xl">
      {/* Subtle gradient overlay for consistency */}
      <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-background/0 via-background/60 to-background z-10 pointer-events-none" />

      <div className="p-8 h-full flex flex-col relative items-center justify-center text-center">
        {/* Icon at the top */}
        <div className="mb-6 relative z-20">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-all duration-300">
            <FileText className="w-8 h-8 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-4 relative z-20">
          <h3 className="text-2xl font-bold text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-300">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="mb-8 relative z-20">
          <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-xs group-hover:text-muted-foreground/80 transition-colors duration-300">
            {message}
          </p>
        </div>

        {/* Bottom action area with accent border on hover */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
          <div
            className="flex items-center justify-center border-2 border-transparent group-hover:border-accent group-hover:bg-background/10 group-hover:backdrop-blur-sm rounded-3xl p-4 transition-all duration-500 ease-out"
            onClick={onClick}
          >
            {/* Action text */}
            <span className="text-lg font-bold text-muted-foreground/60 group-hover:text-accent transition-all duration-500 ease-out mr-2">
              <p className="text-lg font-bold text-accent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out mr-2">
                {actionText}
              </p>{" "}
            </span>

            {/* Arrow with smoother animation */}
            <ArrowRight className="w-5 h-5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:text-accent group-hover:translate-x-2 transition-all duration-500 ease-out" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmptyBillCard;
