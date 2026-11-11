import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * One way deeper into a place: an icon, a number, and a line. Sized so four fit on a phone's first screen,
 * two by two, each an easy tap.
 */
export function DepthTile({
  href,
  icon: Icon,
  title,
  count,
  detail,
  testId,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  count?: number | null;
  detail: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-28 min-w-0 flex-col justify-between gap-2 rounded-2xl border-2 border-b-4 bg-card p-3 hover:bg-muted active:translate-y-0.5 active:border-b-2 sm:p-4"
      data-testid={testId}
    >
      <span className="flex items-center justify-between gap-2">
        <Icon className="size-6 shrink-0 text-primary" aria-hidden />
        {count !== undefined && count !== null ? <span className="text-2xl font-extrabold tabular-nums leading-none">{count.toLocaleString()}</span> : null}
      </span>
      <span className="min-w-0">
        <span className="block font-extrabold leading-tight">{title}</span>
        <span className="block text-xs leading-snug text-muted-foreground sm:text-sm">{detail}</span>
      </span>
    </Link>
  );
}
