"use client";

import { useState } from "react";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";

type Kind = "bug" | "feature";

const KINDS: Record<Kind, { label: string; endpoint: string; field: string; placeholder: string }> = {
  bug: {
    label: "Something's wrong",
    endpoint: "/api/bug-report",
    field: "bug",
    placeholder: "What happened, and what did you expect? Which page were you on?",
  },
  feature: {
    label: "I have an idea",
    endpoint: "/api/feature-suggestion",
    field: "feature",
    placeholder: "What would make Coolbills more useful to you?",
  },
};

export function FeedbackForm({ signedIn }: { signedIn: boolean }) {
  const [kind, setKind] = useState<Kind>("bug");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);
  const details = KINDS[kind];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signedIn) return openLogin(true);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(details.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [details.field]: text }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "That didn't send. Please try again.");
      }
      setSent(true);
      setText("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-3" data-testid="feedback-sent">
        <p role="status">Thanks. We read every one of these.</p>
        <Button type="button" variant="outline" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">What kind of feedback is this?</legend>
        {(Object.keys(KINDS) as Kind[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant={kind === value ? "default" : "outline"}
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
            data-testid={`feedback-${value}`}
          >
            {KINDS[value].label}
          </Button>
        ))}
      </fieldset>
      <textarea
        required
        rows={5}
        maxLength={5000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={details.placeholder}
        aria-label="Your feedback"
        data-testid="feedback-text"
        className="w-full rounded-md border border-input bg-transparent p-3 text-sm font-normal"
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={saving || !text.trim()} data-testid="feedback-submit">
        {saving ? "Sending..." : "Send feedback"}
      </Button>
    </form>
  );
}
