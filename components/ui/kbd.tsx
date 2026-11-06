import * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-6 items-center rounded-md border-2 border-b-4 bg-card px-1.5 font-sans text-xs font-extrabold text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
