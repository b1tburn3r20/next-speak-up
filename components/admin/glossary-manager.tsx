"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { OuterBlock } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeWord } from "@/lib/glossary/match";

type Term = { id: number; keyword: string; definition: string };
type Limits = { keywordMax: number; definitionMax: number };

async function send(method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const response = await fetch("/api/admin/glossary", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "That didn't save.");
}

/** The keyword and definition fields, for adding a meaning or editing one in place. */
function TermForm({
  initial,
  limits,
  submitLabel,
  onSubmit,
  onCancel,
  testId,
}: {
  initial: { keyword: string; definition: string };
  limits: Limits;
  submitLabel: string;
  onSubmit: (value: { keyword: string; definition: string }) => Promise<void>;
  onCancel?: () => void;
  testId: string;
}) {
  const [keyword, setKeyword] = useState(initial.keyword);
  const [definition, setDefinition] = useState(initial.definition);
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ keyword: keyword.trim(), definition: definition.trim() });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3" data-testid={testId}>
      <div className="space-y-1.5">
        <Label htmlFor={`${testId}-keyword`}>Word or phrase</Label>
        <Input
          id={`${testId}-keyword`}
          value={keyword}
          maxLength={limits.keywordMax}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Like cloture, CBO, or motion to recommit"
          required
          data-testid={`${testId}-keyword`}
        />
        <p className="text-xs text-muted-foreground">
          Case doesn&apos;t matter, except all-capital acronyms, which only match in capitals. Plurals match too.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${testId}-definition`}>What it means, in plain words</Label>
        <Textarea
          id={`${testId}-definition`}
          value={definition}
          maxLength={limits.definitionMax}
          onChange={(event) => setDefinition(event.target.value)}
          placeholder="One or two short sentences a 13-year-old would follow"
          required
          className="min-h-20"
          data-testid={`${testId}-definition`}
        />
        <p className="text-right text-xs tabular-nums text-muted-foreground">
          {definition.length}/{limits.definitionMax}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !keyword.trim() || !definition.trim()} data-testid={`${testId}-save`}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            <X className="size-4" aria-hidden />
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function TermRow({ term, limits }: { term: Term; limits: Limits }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  if (editing) {
    return (
      <li className="py-3">
        <TermForm
          initial={term}
          limits={limits}
          submitLabel="Save"
          testId="glossary-edit"
          onCancel={() => setEditing(false)}
          onSubmit={async (value) => {
            await send("PATCH", { id: term.id, ...value });
            toast.success("Saved");
            setEditing(false);
            router.refresh();
          }}
        />
      </li>
    );
  }
  const remove = async () => {
    if (!window.confirm(`Remove this meaning of "${term.keyword}"?`)) return;
    setRemoving(true);
    try {
      await send("DELETE", { id: term.id });
      toast.success("Removed");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setRemoving(false);
    }
  };
  return (
    <li className="flex items-start gap-2 py-2.5" data-testid="glossary-term">
      <p className="min-w-0 flex-1 break-words text-sm">{term.definition}</p>
      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`Edit ${term.keyword}`} data-testid="glossary-term-edit">
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={remove}
        disabled={removing}
        aria-label={`Remove this meaning of ${term.keyword}`}
        data-testid="glossary-term-remove"
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </li>
  );
}

/** Find a word, change what it says, or add one. Each meaning is its own row. */
export function GlossaryManager({ terms, keywordMax, definitionMax }: { terms: Term[] } & Limits) {
  const router = useRouter();
  const limits = { keywordMax, definitionMax };
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => {
    const wanted = normalizeWord(query.trim());
    const byKey = new Map<string, Term[]>();
    for (const term of terms) {
      const key = normalizeWord(term.keyword);
      if (wanted && !key.includes(wanted) && !normalizeWord(term.definition).includes(wanted)) continue;
      byKey.set(key, [...(byKey.get(key) ?? []), term]);
    }
    return [...byKey.values()];
  }, [terms, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a word or a definition"
          aria-label="Find a word"
          className="min-w-0 flex-1"
          data-testid="glossary-search"
        />
        {adding ? null : (
          <Button onClick={() => setAdding(true)} data-testid="glossary-add">
            <Plus className="size-4" aria-hidden />
            Add a word
          </Button>
        )}
      </div>

      {adding ? (
        <OuterBlock>
          <TermForm
            initial={{ keyword: query.trim(), definition: "" }}
            limits={limits}
            submitLabel="Add it"
            testId="glossary-new"
            onCancel={() => setAdding(false)}
            onSubmit={async (value) => {
              await send("POST", value);
              toast.success(`Added ${value.keyword}`);
              setAdding(false);
              router.refresh();
            }}
          />
        </OuterBlock>
      ) : null}

      <p className="text-sm text-muted-foreground" data-testid="glossary-count">
        {groups.length} word{groups.length === 1 ? "" : "s"}
        {query ? ` matching "${query}"` : ""}, {terms.length} meaning{terms.length === 1 ? "" : "s"} in all
      </p>

      {groups.length === 0 ? (
        <OuterBlock>
          <p className="text-sm text-muted-foreground">Nothing matches. Add it as a new word.</p>
        </OuterBlock>
      ) : (
        <ul className="space-y-2" data-testid="glossary-words">
          {groups.map((meanings) => (
            <li key={meanings[0].id}>
              <OuterBlock className="space-y-1 py-3">
                <p className="font-extrabold" data-testid="glossary-keyword">
                  {meanings[0].keyword}
                  {meanings.length > 1 ? <span className="ml-2 text-xs font-bold text-muted-foreground">{meanings.length} meanings</span> : null}
                </p>
                <ul className="divide-y">
                  {meanings.map((term) => (
                    <TermRow key={term.id} term={term} limits={limits} />
                  ))}
                </ul>
              </OuterBlock>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
