import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "destructive" | "outline" | "green" | "super" | "primary";
}

// 16px text on a phone, because iPhones zoom the page in on anything smaller.
const BASE =
  "flex h-11 w-full min-w-0 rounded-xl border-2 border-b-4 bg-card px-3 py-2 text-base font-semibold text-foreground transition-colors placeholder:font-medium placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm";

const inputVariants: Record<string, string> = {
  default: "",
  ghost: "border-transparent bg-transparent",
  destructive: "border-destructive",
  outline: "bg-muted",
  green: "border-support",
  super: "border-xp",
  primary: "border-primary",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(BASE, inputVariants[variant] ?? "", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
