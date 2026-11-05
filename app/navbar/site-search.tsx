"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Result = { href: string; label: string; title: string };
type Results = { bills: Result[]; members: Result[] };

const EMPTY: Results = { bills: [], members: [] };

const SiteSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 250);
  const [results, setResults] = useState<Results>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults(EMPTY);
      setStatus("idle");
      return;
    }
    // Ignores an older search that finishes after a newer one has started.
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/civic/search?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setResults(data);
        setStatus("done");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [debounced]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const noResults =
    status === "done" && results.bills.length === 0 && results.members.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="site-search" className="gap-2 font-normal">
          <Search className="size-4" />
          Search anything…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search Coolbills</DialogTitle>
          <DialogDescription>Find bills and members of Congress.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          placeholder="Like H.R. 1 or a member's name"
          aria-label="Search"
          onChange={(event) => setQuery(event.target.value)}
          data-testid="site-search-input"
        />
        <div className="max-h-[50dvh] space-y-3 overflow-y-auto font-normal" aria-live="polite">
          {status === "error" ? (
            <p className="text-sm text-destructive">Search isn&apos;t working right now.</p>
          ) : null}
          {noResults ? <p className="text-sm text-muted-foreground">No matches found.</p> : null}
          {(
            [
              ["Members", results.members],
              ["Bills", results.bills],
            ] as const
          ).map(([heading, items]) =>
            items.length > 0 ? (
              <div key={heading}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{heading}</p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="block rounded-md p-2 text-sm hover:bg-accent/50"
                        data-testid="search-result"
                      >
                        <span className="font-medium">{item.label}</span>{" "}
                        <span className="line-clamp-1 break-words text-muted-foreground">
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiteSearch;
