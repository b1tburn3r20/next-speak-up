"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/** A chunky lesson-style bar, with a highlight along the top of the fill. */
function Progress({
  className,
  value = 0,
  max = 100,
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value" | "max"> & {
  value?: number;
  max?: number;
}) {
  // Radix rejects a max of 0, which an empty session would otherwise send.
  const safeMax = max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={safeValue}
      max={safeMax}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-background-dark", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="relative h-full rounded-full bg-support transition-[width] duration-300 ease-out after:absolute after:inset-x-2 after:top-1 after:h-1 after:rounded-full after:bg-white/30 motion-reduce:transition-none"
        style={{ width: `${(safeValue / safeMax) * 100}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
