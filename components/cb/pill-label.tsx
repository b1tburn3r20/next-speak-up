import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";

const pillLabelVariants = cva("rounded-md p-2 w-fit shadow-sm", {
  variants: {
    variant: {
      default: "bg-transparent text-muted-foreground",
      blue: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
      green: "bg-green-500/10 text-green-500 dark:text-green-400",
      red: "bg-red-500/10 text-red-500 dark:text-red-400",
      orange: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
      yellow: "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400",
      purple: "bg-purple-500/10 text-purple-500 dark:text-purple-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface PillLabelProps
  extends
  React.ComponentProps<"label">,
  VariantProps<typeof pillLabelVariants> { }

const PillLabel = ({
  className,
  variant,
  children,
  ...props
}: PillLabelProps) => {
  return (
    <Label className={cn(pillLabelVariants({ variant }), className)} {...props}>
      {children}
    </Label>
  );
};

export default PillLabel;
