import { InnerBlock as Block } from "@/components/blocks";
import { cn } from "@/lib/utils";

/** Older pages use this. New pages should import from components/blocks directly. */
const InmostBlock = ({ className, ...rest }: React.ComponentProps<"div">) => (
  <Block className={cn("bg-card", className)} {...rest} />
);

export default InmostBlock;
