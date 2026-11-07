"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { AnswerSkeleton } from "@/components/app/skeletons";
import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What would this bill change?",
  "Who would be affected by this?",
  "What does it cost, and who pays?",
];

export function BillAskAi({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEnd = useRef<HTMLLIElement>(null);
  const openLogin = useLoginStore((store) => store.setIsLoginDialogOpen);

  const ask = async (question: string) => {
    const content = question.trim();
    if (!content || waiting) return;
    if (!signedIn) return openLogin(true);
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setWaiting(true);
    try {
      const response = await fetch("/api/civic/bills/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messages: next }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.content) {
        throw new Error(data?.error ?? "We couldn't get an answer. Please try again.");
      }
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      setWaiting(false);
      requestAnimationFrame(() => listEnd.current?.scrollIntoView({ block: "nearest" }));
    }
  };

  return (
    <div className="space-y-3" data-testid="bill-ask-ai">
      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal text-left"
              onClick={() => ask(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : (
        <ol className="max-h-96 space-y-2 overflow-y-auto" aria-live="polite">
          {messages.map((message, index) => (
            <li
              key={index}
              data-testid={`chat-${message.role}`}
              className={`whitespace-pre-wrap break-words rounded-lg p-2 text-sm font-normal ${
                message.role === "user" ? "ml-6 bg-muted" : "mr-6 border"
              }`}
            >
              {message.content}
            </li>
          ))}
          {waiting ? (
            <li className="mr-6">
              <AnswerSkeleton />
            </li>
          ) : null}
          <li ref={listEnd} aria-hidden />
        </ol>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="Ask about this bill"
          aria-label="Ask about this bill"
        />
        <Button type="submit" disabled={waiting || !draft.trim()} aria-label="Send question">
          {waiting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Answers are AI-generated from the bill&apos;s text and can be wrong. Check the text for
        anything important.
      </p>
    </div>
  );
}
