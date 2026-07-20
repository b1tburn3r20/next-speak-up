import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?:
  | "default"
  | "ghost"
  | "destructive"
  | "outline"
  | "green"
  | "super"
  | "primary";
}

const inputVariants: Record<string, string> = {
  default:
    "h-14  flex md:h-9 w-full rounded-md border border-input bg-background-light px-3 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 border-b-4 focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "h-14 flex md:h-9 w-full rounded-md border-2 border-b-4 border-transparent bg-transparent px-3 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:translate-y-[2px]  disabled:cursor-not-allowed disabled:opacity-50 shadow-none",
  destructive:
    "h-14 flex md:h-9 w-full rounded-md border-2 border-b-4 border-rose-600 bg-white px-3 py-1 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-rose-400/60 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100 dark:placeholder:text-rose-600",
  outline:
    "h-14 flex md:h-9 w-full rounded-md border-2 border-b-4 border-muted-foreground/40 bg-muted px-3 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50",
  green:
    "h-14 flex md:h-9 w-full rounded-md border-2 border-b-4 border-green-500 bg-transparent px-3 py-1 text-sm font-medium text-green-700 shadow-sm transition-all placeholder:text-green-400/50 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] focus-visible:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:border-green-500 dark:placeholder:text-green-600 dark:focus-visible:bg-green-950/40",
  super:
    "h-14 flex md:h-9 w-full rounded-md border-2 border-b-4 border-indigo-600 bg-white px-3 py-1 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-indigo-400/60 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-100 dark:placeholder:text-indigo-600",
  primary:
    "h-14 rounded-md md:h-9 w-full px-3 py-1 bg-primary/80 text-white border-primary border-b-4 hover:bg-primary/90 active:border-b-0 dark:bg-primary dark:border-green-700/40 dark:hover:bg-primary/90 disabled:opacity-50",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants[variant] ?? inputVariants.default,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
