"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { DialogPopover } from "@/components/ui/dialog-popover";
import { segmentText, type GlossaryIndex, type GlossaryWord, type Segment } from "@/lib/glossary/match";
import { parseSimpleHtml, type SimpleNode, type SimpleTag } from "@/lib/glossary/simple-html";
import { routes } from "@/lib/routes";
import { useGlossaryIndex } from "@/stores/use-glossary-store";

/** What each meaning says, numbered when there's more than one, like an acronym's. */
function Meanings({ word }: { word: GlossaryWord }) {
  return (
    <div className="space-y-2 py-2" data-testid="glossary-meanings">
      {word.definitions.length === 1 ? (
        <p>{word.definitions[0]}</p>
      ) : (
        <>
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">It can mean</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            {word.definitions.map((definition) => (
              <li key={definition}>{definition}</li>
            ))}
          </ol>
        </>
      )}
      <Link href={routes.learn} className="inline-block text-xs font-bold text-primary hover:underline">
        More plain-English words
      </Link>
    </div>
  );
}

/** One glossary word in a sentence: underlined, and a tap away from what it means. */
function GlossaryWordTrigger({ text, word }: { text: string; word: GlossaryWord }) {
  return (
    <DialogPopover
      inline
      trigger={text}
      title={word.keyword.charAt(0).toUpperCase() + word.keyword.slice(1)}
      label={`${text}: what it means`}
      className="bg-primary/5 px-0.5 font-[inherit] text-inherit underline decoration-primary decoration-2 underline-offset-[3px] hover:bg-primary/10"
      contentClassName="w-80"
      testId="glossary-word"
    >
      <Meanings word={word} />
    </DialogPopover>
  );
}

function Segments({ segments }: { segments: Segment[] }) {
  const index = useGlossaryIndex();
  return (
    <>
      {segments.map((segment, position) => {
        if (typeof segment === "string") return <Fragment key={position}>{segment}</Fragment>;
        const word = index.words.get(segment.key);
        return word ? <GlossaryWordTrigger key={position} text={segment.text} word={word} /> : <Fragment key={position}>{segment.text}</Fragment>;
      })}
    </>
  );
}

/**
 * Text with its legislative words explained: each one found in the glossary is underlined, and opens
 * its meaning. Only a word's first use is marked, unless `everyUse`.
 */
export function LegiText({ text, everyUse = false }: { text: string; everyUse?: boolean }) {
  const index = useGlossaryIndex();
  const segments = useMemo(() => segmentText(text, index, new Set(), everyUse), [text, index, everyUse]);
  return <Segments segments={segments} />;
}

type MatchedNode = Segment[] | { tag: SimpleTag; children: MatchedNode[] };

/** Matches every text run of a summary in one pass, so a word is underlined once in the whole thing. */
function matchTree(nodes: SimpleNode[], index: GlossaryIndex, seen: Set<string>): MatchedNode[] {
  return nodes.map((node) => (typeof node === "string" ? segmentText(node, index, seen) : { tag: node.tag, children: matchTree(node.children, index, seen) }));
}

function MatchedNodes({ nodes }: { nodes: MatchedNode[] }) {
  return (
    <>
      {nodes.map((node, position) => {
        if (Array.isArray(node)) return <Segments key={position} segments={node} />;
        if (node.tag === "br") return <br key={position} />;
        const Tag = node.tag;
        return (
          <Tag key={position}>
            <MatchedNodes nodes={node.children} />
          </Tag>
        );
      })}
    </>
  );
}

/** A sanitized summary's HTML, rendered as elements with its legislative words explained. */
export function LegiHtml({ html, className, testId }: { html: string; className?: string; testId?: string }) {
  const index = useGlossaryIndex();
  // Pure: the set is made inside, so rendering twice (as React does in development) gives the same answer.
  const nodes = useMemo(() => matchTree(parseSimpleHtml(html), index, new Set()), [html, index]);
  return (
    <div className={className} data-testid={testId}>
      <MatchedNodes nodes={nodes} />
    </div>
  );
}
