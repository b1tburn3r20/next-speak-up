"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

// Radix doesn't allow an empty value, and "Any status" needs one. It never leaves this file.
const EMPTY = "__empty__";

/**
 * A dropdown from a list of options. It works in a plain form with `name`, on a server-rendered page
 * or in client code with `value`, and the option with an empty value means "any".
 */
export function OptionSelect({
  options,
  name,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  id,
  className,
  disabled,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: {
  options: SelectOption[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "data-testid"?: string;
}) {
  const [own, setOwn] = useState(defaultValue);
  // Clearing filters is a client navigation, which keeps this mounted with a new default.
  const [lastDefault, setLastDefault] = useState(defaultValue);
  if (defaultValue !== lastDefault) {
    setLastDefault(defaultValue);
    setOwn(defaultValue);
  }

  const current = value ?? own;
  const selected = options.find((option) => option.value === current);

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Select
        value={selected ? selected.value || EMPTY : ""}
        disabled={disabled}
        onValueChange={(next) => {
          const real = next === EMPTY ? "" : next;
          setOwn(real);
          onValueChange?.(real);
        }}
      >
        <SelectTrigger
          id={id}
          aria-label={ariaLabel}
          data-testid={testId}
          className={cn("w-full min-w-0", className)}
        >
          {/*
            Given as children so the label is in the server's HTML, not filled in after hydration.
            Never undefined: without children Radix portals into this node, and it would then have both.
          */}
          <SelectValue placeholder={placeholder}>{selected?.label ?? ""}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || EMPTY} value={option.value || EMPTY}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
