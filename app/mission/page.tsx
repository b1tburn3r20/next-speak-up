import type { Metadata } from "next";
import { Grid, OuterBlock, PageHeader, PageSpacer, Section } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import LandingNavbar from "../landing/navbar/navbar";

export const metadata: Metadata = {
  title: "Our mission",
  description: "Coolbills demystifies the U.S. government, so you can tell whether it represents you.",
};

const BELIEFS = [
  {
    title: "You decide",
    body: "We never say which party or position is right. Only your own votes decide whether someone represents you.",
  },
  {
    title: "Plain words",
    body: "If a term needs a law degree, we explain it. A simple explanation still has to be accurate.",
  },
  {
    title: "Real data",
    body: "Bills, votes, and members come from official sources. When something's missing, we say so instead of guessing.",
  },
];

export default function MissionPage() {
  return (
    <LandingNavbar>
      <PageSpacer width="narrow" className="pt-24">
        <PageHeader
          title="Our mission"
          description="Government shouldn't be a mystery. Coolbills helps you see what Congress is doing, in plain words, and tell whether the people you elected actually represent you."
        />
        <Section title="What we believe">
          <Grid cols="cards">
            {BELIEFS.map((belief) => (
              <OuterBlock key={belief.title}>
                <h3 className="font-extrabold">{belief.title}</h3>
                <p className="text-sm text-muted-foreground">{belief.body}</p>
              </OuterBlock>
            ))}
          </Grid>
        </Section>
        <NextStepCard
          step={{
            id: "try",
            title: "See for yourself",
            description: "Vote on a real bill, then find out if your reps agree.",
            href: "/vote",
            cta: "Try it now",
            tone: "primary",
          }}
        />
      </PageSpacer>
    </LandingNavbar>
  );
}
