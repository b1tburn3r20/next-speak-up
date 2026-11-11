"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type CityChoice = { key: string; name: string };
type Found = CityChoice & { population: number | null };

/** Pick a city by typing its name. A state has hundreds, too many for a list. */
export function CitySearch({
  stateKey,
  value,
  onChange,
  placeholder = "Somewhere else",
}: {
  stateKey: string;
  value: CityChoice | null;
  onChange: (city: CityChoice | null) => void;
  /** What the button says before a city is chosen. */
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [loading, setLoading] = useState(false);

  const search = (text: string) => {
    setQuery(text);
    const ready = text.trim().length >= 2;
    setLoading(ready);
    if (!ready) setFound([]);
  };

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/civic/cities?state=${encodeURIComponent(stateKey)}&q=${encodeURIComponent(text)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { cities: [] }))
        .then((body: { cities: Found[] }) => setFound(body.cities ?? []))
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, stateKey]);

  const choose = (city: CityChoice | null) => {
    onChange(city);
    setOpen(false);
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" role="combobox" aria-expanded={open} aria-label="Your city" className="w-full justify-between font-bold" data-testid="seat-city">
          <span className="truncate">{value ? value.name : placeholder}</span>
          <ChevronDown className="text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput autoFocus placeholder="Type your city's name" value={query} onValueChange={search} data-testid="seat-city-search" />
          <CommandList>
            {loading ? (
              <div className="space-y-2 p-2" data-testid="city-search-loading">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : (
              <CommandEmpty>{query.trim().length < 2 ? "Type at least two letters." : "No city by that name."}</CommandEmpty>
            )}
            <CommandGroup>
              {value ? (
                <CommandItem value="__none" onSelect={() => choose(null)}>
                  Somewhere else
                </CommandItem>
              ) : null}
              {loading
                ? null
                : found.map((city) => (
                    <CommandItem key={city.key} value={city.key} onSelect={() => choose({ key: city.key, name: city.name })} data-testid="seat-city-option">
                      <span className="min-w-0 flex-1 truncate">{city.name}</span>
                      {city.population ? <span className="text-xs text-muted-foreground">{city.population.toLocaleString()}</span> : null}
                      <Check className={cn("size-4", value?.key === city.key ? "opacity-100" : "opacity-0")} aria-hidden />
                    </CommandItem>
                  ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
