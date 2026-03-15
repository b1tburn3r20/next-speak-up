import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "destructive" | "outline" | "green" | "super" | "primary";
}

const inputVariants: Record<string, string> = {
  default:
    "flex h-9 w-full rounded-md border border-input bg-background-light px-3 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 border-b-4 focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted dark:border-muted-foreground/20 dark:text-foreground dark:placeholder:text-muted-foreground/50 dark:focus-visible:ring-foreground/20",
  ghost:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-transparent bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 shadow-sm transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] focus-visible:border-slate-300 focus-visible:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-600",
  destructive:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-rose-600 bg-white px-3 py-1 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-rose-400/60 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-100 dark:placeholder:text-rose-600",
  outline:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-muted-foreground/40 bg-muted px-3 py-1 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent dark:border-muted-foreground/20 dark:text-foreground dark:placeholder:text-muted-foreground/40 dark:focus-visible:border-muted-foreground/40",
  green:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-green-500 bg-transparent px-3 py-1 text-sm font-medium text-green-700 shadow-sm transition-all placeholder:text-green-400/50 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] focus-visible:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:border-green-500 dark:placeholder:text-green-600 dark:focus-visible:bg-green-950/40",
  primary:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-sky-600 bg-white px-3 py-1 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-indigo-400/60 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-950/30 dark:border-sky-700 dark:text-indigo-100 dark:placeholder:text-sky-600",
  super:
    "flex h-9 w-full rounded-md border-2 border-b-4 border-indigo-600 bg-white px-3 py-1 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-indigo-400/60 focus-visible:outline-none focus-visible:border-b-2 focus-visible:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-100 dark:placeholder:text-indigo-600",
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
