import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/app/page-states";
import { BillCard } from "@/components/bills/bill-card";
import { PageHeader, PageShell, Stack } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { buttonVariants } from "@/components/ui/button";
import { listBills } from "@/lib/civic/bills";
import { policyAreaBySlug } from "@/lib/civic/policy-areas";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const area = policyAreaBySlug((await params).slug);
  return { title: area?.name ?? "Topic not found", description: area?.explanation };
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const area = policyAreaBySlug((await params).slug);
  if (!area) notFound();
  const { cursor } = await searchParams;
  const { bills, nextCursor } = await listBills({ policyArea: area.name, cursor });

  return (
    <PageShell>
      <PageHeader
        back={{ href: "/topics", label: "All topics" }}
        title={area.name}
        description={area.explanation}
        action={<PolicyChip name={area.name} />}
      />
      {bills.length > 0 ? (
        <Stack data-testid="topic-bills">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </Stack>
      ) : (
        <EmptyState title="No bills in this topic yet" action={{ href: "/topics", label: "Pick another topic" }}>
          More bills arrive every day.
        </EmptyState>
      )}
      {nextCursor ? (
        <Link href={`?cursor=${nextCursor}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Show more bills
        </Link>
      ) : null}
      <NextStepCard
        step={{
          id: "vote",
          title: "Ready to weigh in?",
          description: "Vote on real bills, and see how your reps compare.",
          href: "/vote",
          cta: "Start voting",
          tone: "primary",
        }}
      />
    </PageShell>
  );
}
