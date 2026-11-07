import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ArrowRight, Book, Briefcase, CalendarClock, Compass, type LucideIcon } from "lucide-react";
import { Grid, OuterBlock, PageHeader, PageSpacer } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { routes, stateRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Federal government",
  description: "What Congress is doing, what's coming up, and who's behind it.",
};

const PLACES: { href: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    href: routes.federal.upcoming,
    icon: CalendarClock,
    title: "Upcoming votes",
    description: "What the House may vote on next, so you can weigh in first.",
  },
  {
    href: routes.federal.bills,
    icon: Book,
    title: "Bills",
    description: "Every bill in this Congress, in plain words.",
  },
  {
    href: routes.federal.legislators,
    icon: Briefcase,
    title: "Legislators",
    description: "All 535 members of Congress, and how they do their jobs.",
  },
  {
    href: routes.federal.topics,
    icon: Compass,
    title: "Topics",
    description: "Bills grouped by what they're about, like health or taxes.",
  },
  {
    href: stateRoutes.home,
    icon: Landmark,
    title: "Iowa",
    description: "The first state we cover: its legislators, bills, and meetings.",
  },
];

export default function FederalPage() {
  return (
    <PageSpacer>
      <PageHeader
        title="The federal government"
        description="Congress writes the laws for the whole country. Here's what it's doing right now."
      />
      <Grid cols="halves">
        {PLACES.map(({ href, icon: Icon, title, description }) => (
          <OuterBlock key={href} className="relative transition-colors hover:border-primary/60">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold">
                  <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                    {title}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          </OuterBlock>
        ))}
      </Grid>
      <NextStepCard
        label="Not sure where to start?"
        step={{
          id: "federal-start",
          title: "Vote on your first bill",
          description: "Then find out whether your representative agrees with you.",
          href: routes.vote,
          cta: "Start voting",
          tone: "primary",
        }}
      />
    </PageSpacer>
  );
}
