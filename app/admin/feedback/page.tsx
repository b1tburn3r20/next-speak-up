import type { Metadata } from "next";
import Link from "next/link";
import { Bug, Lightbulb } from "lucide-react";
import { AdminActionButton } from "@/components/admin/admin-actions";
import { formatWhen } from "@/components/admin/run-status";
import { OuterBlock, PageHeader, Section } from "@/components/blocks";
import { buttonVariants } from "@/components/ui/button";
import { requirePagePermission } from "@/lib/admin/access";
import { listFeedback } from "@/lib/admin/queries";
import { profilePath } from "@/lib/routes";

export const metadata: Metadata = { title: "Feedback" };

type Item = { id: number; text: string; createdAt: Date; resolvedAt: Date | null; username: string | null; userId: string };

function FeedbackList({ items, kind, empty }: { items: Item[]; kind: "bug" | "idea"; empty: string }) {
  if (items.length === 0) return <OuterBlock><p className="text-sm text-muted-foreground">{empty}</p></OuterBlock>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} data-testid="feedback-item" data-kind={kind}>
          <OuterBlock className="space-y-2">
            <p className="whitespace-pre-wrap break-words">{item.text}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-xs text-muted-foreground">
                <Link href={profilePath(item.userId)} className="font-bold hover:underline">
                  {item.username ?? "Someone with no username"}
                </Link>
                , {formatWhen(item.createdAt.toISOString())}
              </p>
              <AdminActionButton
                url="/api/admin/feedback"
                method="PATCH"
                body={{ kind, id: item.id, resolved: !item.resolvedAt }}
                label={item.resolvedAt ? "Reopen" : "Mark as done"}
                testId="feedback-toggle"
              />
            </div>
          </OuterBlock>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requirePagePermission("feedback.view");
  const showAll = (await searchParams).all === "1";
  const { bugs, ideas } = await listFeedback(showAll);
  const toItem = (text: string, row: { id: number; createdAt: Date; resolvedAt: Date | null; user: { id: string; username: string | null } }): Item => ({
    id: row.id,
    text,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    username: row.user.username,
    userId: row.user.id,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description={showAll ? "Everything people have sent." : "What still needs a look."}
        action={
          <Link href={showAll ? "/admin/feedback" : "/admin/feedback?all=1"} className={buttonVariants({ variant: "secondary", size: "sm" })} data-testid="feedback-filter">
            {showAll ? "Only what's open" : "Include what's done"}
          </Link>
        }
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={<span className="flex items-center gap-2"><Bug className="size-5" aria-hidden /> Bug reports ({bugs.length})</span>}>
          <FeedbackList items={bugs.map((row) => toItem(row.bug, row))} kind="bug" empty="No bug reports to look at." />
        </Section>
        <Section title={<span className="flex items-center gap-2"><Lightbulb className="size-5" aria-hidden /> Ideas ({ideas.length})</span>}>
          <FeedbackList items={ideas.map((row) => toItem(row.feature, row))} kind="idea" empty="No ideas to look at." />
        </Section>
      </div>
    </div>
  );
}
