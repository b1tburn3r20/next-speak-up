import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  " inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-white border-primary border-b-4 hover:bg-primary/90 active:border-b-0 dark:bg-primary dark:border-green-700/40 dark:hover:bg-primary/90",
        secondary:
          "bg-background-light text-muted-foreground border-2 border-b-4 hover:bg-muted/40 active:border-b-2 ",
        super:
          "bg-blue-500 text-white border-blue-600 border-b-4 hover:bg-blue-500/90 active:border-b-0 dark:bg-blue-600 dark:border-blue-700 dark:hover:bg-blue-600/90",
        outline:
          "bg-background-light text-muted-foreground border-2 border-b-4 hover:bg-muted/40 active:border-b-2 ",
        destructive:
          "bg-rose-500 text-white border-rose-600 border-b-4 hover:bg-rose-500/90 active:border-b-0 dark:bg-rose-600 dark:border-rose-700 dark:hover:bg-rose-600/90",
        cartoon_green_outline:
          "bg-transparent text-green-600 border-2 border-green-500 border-b-4 hover:bg-green-50 active:border-b-2 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-950/40",
        cartoon_dangerOutline:
          "bg-white text-rose-500 border-2 border-rose-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-slate-800",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 md:h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
