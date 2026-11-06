"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { PolicyIcon } from "@/components/civic/policy-chip";
import { MemberPhoto } from "@/components/people/member-photo";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { policyStyle } from "@/lib/civic/policy-areas";
import type { SearchProviderInfo, SearchResult } from "@/lib/search/types";
import { useSearchStore } from "@/stores/use-search-store";

type GroupState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: SearchResult[] };

function ResultSkeleton() {
  return (
    <div className="space-y-2 px-2 py-2" data-testid="search-skeleton" aria-hidden>
      {[0, 1].map((row) => (
        <div key={row} className="flex items-center gap-2">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultIcon({ result }: { result: SearchResult }) {
  if (result.person) {
    return (
      <MemberPhoto
        name={result.person.name}
        url={result.person.imageUrl}
        party={result.person.party}
        size={32}
      />
    );
  }
  if (result.policyArea) {
    const { color, tint } = policyStyle(result.policyArea);
    return (
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: tint }}
      >
        <PolicyIcon name={result.policyArea} className="size-4" style={{ color }} aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
      <CornerDownLeft className="size-4 text-muted-foreground" aria-hidden />
    </span>
  );
}

/**
 * Asks every provider separately, so each group fills in when it's ready, and one slow or broken
 * provider can't hold up the rest. Typing again cancels whatever's still running.
 */
function useProviderSearch(providers: SearchProviderInfo[], query: string, enabled: boolean) {
  const [answers, setAnswers] = useState<{ query: string; groups: Record<string, GroupState> }>({
    query: "",
    groups: {},
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    for (const provider of providers) {
      if (query.length < provider.minQueryLength) continue;
      const finish = (state: GroupState) => {
        if (controller.signal.aborted) return;
        setAnswers((current) => ({
          query,
          groups: { ...(current.query === query ? current.groups : {}), [provider.id]: state },
        }));
      };
      fetch(`/api/search/${provider.id}?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("search failed");
          const { results } = await response.json();
          finish({ status: "done", results });
        })
        .catch((error) => {
          if (error?.name !== "AbortError") finish({ status: "error" });
        });
    }
    return () => controller.abort();
  }, [providers, query, enabled]);

  // A provider that hasn't answered this query yet is still loading.
  const groups: Record<string, GroupState> = {};
  if (enabled) {
    for (const provider of providers) {
      if (query.length < provider.minQueryLength) continue;
      groups[provider.id] = (answers.query === query && answers.groups[provider.id]) || { status: "loading" };
    }
  }
  return groups;
}

export function SearchDialog() {
  const open = useSearchStore((state) => state.open);
  const setOpen = useSearchStore((state) => state.setOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query.trim(), 180);
  const [providers, setProviders] = useState<SearchProviderInfo[]>([]);
  const listed = useRef(false);

  // Ctrl+K or Cmd+K, from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        useSearchStore.getState().setOpen(!useSearchStore.getState().open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Asked once a visit, the first time it opens. Signing in or out reloads the page.
  useEffect(() => {
    if (!open || listed.current) return;
    listed.current = true;
    fetch("/api/search")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("list failed"))))
      .then((data) => setProviders(data.providers))
      .catch(() => {
        listed.current = false;
      });
  }, [open]);

  const groups = useProviderSearch(providers, debounced, open);
  const states = Object.values(groups);
  const allDone = states.length > 0 && states.every((state) => state.status !== "loading");
  const nothingFound =
    Boolean(debounced) &&
    allDone &&
    states.every((state) => state.status === "done" && state.results.length === 0);

  // Results arrive at different times, so whatever's highlighted may have just gone away.
  const [selected, setSelected] = useState("");
  const values = providers.flatMap((provider) => {
    const group = groups[provider.id];
    return group?.status === "done" ? group.results.map((result) => `${provider.id}:${result.id}`) : [];
  });
  const topValue = values[0] ?? "";
  const stillShown = values.includes(selected);
  // The highlight follows the top result, until someone starts moving it themselves.
  const movedByKeyboard = useRef(false);
  useEffect(() => {
    movedByKeyboard.current = false;
  }, [debounced]);
  useEffect(() => {
    if (!stillShown || !movedByKeyboard.current) setSelected(topValue);
  }, [stillShown, topValue]);

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="top-4 max-h-[85dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12dvh] sm:max-w-xl"
        data-testid="search-dialog"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Find bills, representatives, senators, topics, and more.
        </DialogDescription>
        {/* Results are already ranked on the server, so the list doesn't filter them again. */}
        <Command
          shouldFilter={false}
          value={selected}
          onValueChange={setSelected}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") movedByKeyboard.current = true;
          }}
          className="rounded-none bg-transparent"
        >
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search bills, reps, senators, topics…"
            className="text-base"
            data-testid="site-search-input"
          />
          <CommandList className="max-h-[70dvh]" aria-live="polite">
            {nothingFound ? (
              <p className="px-4 py-8 text-center text-muted-foreground" data-testid="search-empty">
                Nothing matches &ldquo;{debounced}&rdquo;. Try a name, a state, or a bill number like H.R. 1.
              </p>
            ) : null}
            {providers.map((provider) => {
              const group = groups[provider.id];
              if (!group) return null;
              if (group.status === "done" && group.results.length === 0) return null;
              return (
                <CommandGroup key={provider.id} heading={provider.label} data-provider={provider.id}>
                  {group.status === "loading" ? <ResultSkeleton /> : null}
                  {group.status === "error" ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground" data-testid="search-group-error">
                      {provider.label} isn&apos;t working right now. Everything else still is.
                    </p>
                  ) : null}
                  {group.status === "done"
                    ? group.results.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={`${provider.id}:${result.id}`}
                          onSelect={() => {
                            close(false);
                            router.push(result.href);
                          }}
                          className="min-h-11 gap-2.5"
                          data-testid="search-result"
                        >
                          <ResultIcon result={result} />
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 break-words font-bold">
                              {result.badge ? <span className="text-primary">{result.badge} </span> : null}
                              {result.title}
                            </span>
                            {result.subtitle ? (
                              <span className="line-clamp-1 break-words text-sm text-muted-foreground">
                                {result.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))
                    : null}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/** The button that opens search. Sized for wherever it's put. */
export function SearchButton({ compact = false }: { compact?: boolean }) {
  const setOpen = useSearchStore((state) => state.setOpen);
  if (compact) {
    return (
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-lg hover:bg-muted"
        data-testid="site-search-mobile"
      >
        <Search className="size-5" aria-hidden />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-9 w-72 items-center gap-2 rounded-lg border-2 bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      data-testid="site-search"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Search anything…</span>
      <kbd className="rounded border bg-muted px-1.5 text-xs font-bold">Ctrl K</kbd>
    </button>
  );
}
