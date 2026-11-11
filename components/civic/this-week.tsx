import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import { Progress } from "@/components/ui/progress";

export type WeekRow = {
  id: string;
  icon: LucideIcon;
  /** The government, in a word or two: "Congress", "Iowa Legislature", "Des Moines City Council". */
  title: string;
  /** What's happening there this week, in one sentence. */
  detail: string;
  href: string;
  /** Marks a row with something to do now. */
  urgent?: boolean;
  /** How far through this week's bills someone is, as a slim bar under the sentence. */
  progress?: { done: number; total: number };
};

/**
 * One line per government someone has: what's happening there this week, and a tap to go there.
 * It replaces whole boards and lists on the home page, which now live on each government's own page.
 */
export function ThisWeek({ rows }: { rows: WeekRow[] }) {
  if (rows.length === 0) return null;
  return (
    <OuterBlock className="p-0 sm:p-0" data-testid="this-week">
      <ul className="divide-y-2">
        {rows.map(({ id, icon: Icon, title, detail, href, urgent, progress }) => (
          <li key={id}>
            <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-muted sm:px-5" data-testid={`this-week-${id}`}>
              <span className={urgent ? "rounded-xl bg-primary-tint p-2 text-primary" : "rounded-xl bg-muted p-2 text-muted-foreground"}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold leading-snug">{title}</span>
                <span className="block text-sm text-muted-foreground">{detail}</span>
                {progress && progress.total > 0 ? (
                  <span className="mt-1.5 flex items-center gap-2" data-testid={`this-week-${id}-progress`}>
                    <Progress value={progress.done} max={progress.total} className="h-2.5 flex-1" aria-label={`${progress.done} of ${progress.total} voted on`} />
                    <span className="shrink-0 text-xs font-extrabold tabular-nums">
                      {progress.done}/{progress.total}
                    </span>
                  </span>
                ) : null}
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </OuterBlock>
  );
}
