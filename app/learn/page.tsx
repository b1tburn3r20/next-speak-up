import type { Metadata } from "next";
import { Grid, OuterBlock, PageHeader, PageShell, Section } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { GLOSSARY } from "@/lib/civic/glossary";

export const metadata: Metadata = {
  title: "Learn the lingo",
  description: "What Congress's jargon actually means, in plain English.",
};

const PATH = [
  { title: "Introduced", body: "A member proposes a bill. That member is its sponsor." },
  { title: "Committee", body: "A small group studies it. Most bills stop here." },
  { title: "Floor vote", body: "If it moves on, the full House or Senate debates and votes." },
  { title: "The other chamber", body: "Both chambers have to pass the same text." },
  { title: "The President", body: "The President signs it into law, or vetoes it." },
];

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "What's being voted on", keys: ["bill", "joint-resolution", "concurrent-resolution", "resolution", "amendment"] },
  { title: "Who's involved", keys: ["sponsor", "cosponsor", "committee", "party", "crs"] },
  { title: "How a bill moves", keys: ["referred", "markup", "reported", "floor", "engrossed", "concur", "conference", "enrolled"] },
  { title: "How votes work", keys: ["roll-call", "voice-vote", "unanimous-consent", "quorum", "suspension-of-the-rules", "rule", "previous-question", "recommit"] },
  { title: "The Senate's special rules", keys: ["filibuster", "cloture"] },
  { title: "The final step", keys: ["veto", "pocket-veto", "public-law"] },
];

export default function LearnPage() {
  return (
    <PageShell>
      <PageHeader
        title="Learn the lingo"
        description="Congress has its own language. Here's what it means. You can also tap any dotted word in the app."
      />
      <Section title="How a bill becomes a law" data-testid="bill-path">
        <OuterBlock>
          <ol className="space-y-3">
            {PATH.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-extrabold leading-snug">{step.title}</span>
                  <span className="block text-sm text-muted-foreground">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </OuterBlock>
      </Section>
      {GROUPS.map((group) => (
        <Section key={group.title} title={group.title}>
          <Grid cols="halves">
            {group.keys.map((key) => (
              <OuterBlock key={key} data-testid="glossary-entry">
                <h3 className="font-extrabold">{GLOSSARY[key].term}</h3>
                <p className="text-sm">{GLOSSARY[key].short}</p>
              </OuterBlock>
            ))}
          </Grid>
        </Section>
      ))}
      <NextStepCard
        step={{
          id: "practice",
          title: "Put it to use",
          description: "Vote on a real bill, and see how your reps compare.",
          href: "/vote",
          cta: "Start voting",
          tone: "primary",
        }}
      />
    </PageShell>
  );
}
