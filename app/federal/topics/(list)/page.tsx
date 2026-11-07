import type { Metadata } from "next";
import Link from "next/link";
import { Grid, PageHeader, PageSpacer, Section } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { PolicyIcon } from "@/components/civic/policy-chip";
import { POLICY_AREAS, POLICY_FAMILIES, type PolicyFamily } from "@/lib/civic/policy-areas";
import { topicPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Topics",
  description: "Every kind of bill Congress works on, explained simply.",
};

export default function TopicsPage() {
  return (
    <PageSpacer>
      <PageHeader
        title="Topics"
        description="Every bill gets a policy area from the Library of Congress. Pick one you care about."
      />
      {(Object.keys(POLICY_FAMILIES) as PolicyFamily[]).map((family) => {
        const { label, color, tint } = POLICY_FAMILIES[family];
        const areas = POLICY_AREAS.filter((area) => area.family === family);
        return (
          <Section key={family} title={label} data-testid="topic-family">
            <Grid cols="cards">
              {areas.map((area) => {
                return (
                  <Link
                    key={area.slug}
                    href={topicPath(area.slug)}
                    className="flex gap-3 rounded-2xl border-2 border-b-4 bg-card p-3 transition-colors hover:border-primary/60"
                    data-testid="topic-card"
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: tint }}
                    >
                      <PolicyIcon name={area.name} className="size-5" style={{ color }} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words font-extrabold leading-snug">{area.name}</span>
                      <span className="block text-sm text-muted-foreground">{area.explanation}</span>
                    </span>
                  </Link>
                );
              })}
            </Grid>
          </Section>
        );
      })}
      <NextStepCard
        step={{
          id: "learn",
          title: "New to all this?",
          description: "What cloture, markup, and the rest actually mean.",
          href: "/learn",
          cta: "Learn the lingo",
          tone: "xp",
        }}
      />
    </PageSpacer>
  );
}
